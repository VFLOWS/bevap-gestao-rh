import json
import re
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


ROOT = Path(r"c:\Users\lucas\workspace\BEVAP\bevap-gestao-rh\prototype")
HTML_PATH = ROOT / "admissao.html"
RETORNO_PATH = ROOT / "admissao-retorno"
OUTPUT_PATH = ROOT / "admissao-campos.txt"
OUTPUT_VISUAL_PATH = ROOT / "admissao-campos-visuais-por-painel.txt"


def _read_html_best_effort(path: Path) -> str:
    data = path.read_bytes()
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        # Prototype HTMLs often come in legacy encodings.
        return data.decode("latin-1", errors="replace")


def _clean_text(text: str) -> str:
    text = " ".join(text.replace("\u00a0", " ").split())
    text = re.sub(r"\s*:\s*$", "", text)
    return text.strip()


def _fix_mojibake(text: str) -> str:
    """Best-effort fix for common UTF-8 decoded as Latin-1 (e.g. 'AdmissÃ£o').

    Only applies when it looks like mojibake, to avoid breaking already-correct text.
    """
    if not text:
        return text
    if "Ã" not in text and "Â" not in text:
        return text
    try:
        # cp1252 handles characters like 'š' (0x9A) that appear in common mojibake (e.g. 'Ãš').
        try:
            fixed = text.encode("cp1252", errors="strict").decode("utf-8", errors="strict")
        except Exception:
            fixed = text.encode("latin-1", errors="strict").decode("utf-8", errors="strict")
    except Exception:
        return text

    # Heuristic: accept if it reduces mojibake markers.
    bad_before = text.count("Ã") + text.count("Â")
    bad_after = fixed.count("Ã") + fixed.count("Â")
    return fixed if bad_after < bad_before else text


def _humanize_key(key: str) -> str:
    key = key.strip()
    if not key:
        return key
    # Keep common prefixes, but make it readable
    return key.replace("___", " ").replace("_", " ").upper()


@dataclass(frozen=True)
class Field:
    label: str
    field_id: str
    raw_key: str
    name: str
    tag: str
    input_type: str
    placeholder: str
    in_child_row: bool


class _FormHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.labels_for: Dict[str, str] = {}
        self.fields_in_order: List[Dict[str, str]] = []

        self._in_form = False
        self._form_depth = 0

        self._in_label = False
        self._label_for: Optional[str] = None
        self._label_text_parts: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]):
        attrs_dict: Dict[str, str] = {k: (v if v is not None else "") for k, v in attrs}

        if tag == "form":
            self._in_form = True
            self._form_depth = 1
        elif self._in_form:
            self._form_depth += 1

        if not self._in_form:
            return

        if tag == "label":
            self._in_label = True
            self._label_for = attrs_dict.get("for") or None
            self._label_text_parts = []
            return

        if tag in {"input", "select", "textarea", "button"}:
            field_id = attrs_dict.get("id", "")
            field_name = attrs_dict.get("name", "")
            field_type = attrs_dict.get("type", "") if tag == "input" else tag
            placeholder = attrs_dict.get("placeholder", "")

            if not field_id and not field_name:
                return

            self.fields_in_order.append(
                {
                    "tag": tag,
                    "id": field_id,
                    "name": field_name,
                    "type": field_type,
                    "placeholder": placeholder,
                }
            )

    def handle_endtag(self, tag: str):
        if self._in_label and tag == "label":
            label_text = _clean_text("".join(self._label_text_parts))
            if self._label_for and label_text:
                self.labels_for[self._label_for] = label_text
            self._in_label = False
            self._label_for = None
            self._label_text_parts = []
            return

        if self._in_form:
            self._form_depth -= 1
            if tag == "form" and self._form_depth <= 0:
                self._in_form = False

    def handle_data(self, data: str):
        if self._in_label:
            self._label_text_parts.append(data)


@dataclass
class _PanelSection:
    # subsection title (legend/fieldset), None means panel root
    title: Optional[str]
    # ordered unique list of (label, id)
    fields: List[Tuple[str, str]]


@dataclass
class _Panel:
    title: str
    dom_id: str
    order: int
    sections: List[_PanelSection]
    # child tables detected in this panel (tableid -> list of dataset keys)
    child_tables: Dict[str, List[str]]


def _classes(attrs: Dict[str, str]) -> set[str]:
    return {c for c in (attrs.get("class", "").split()) if c}


def _attr_dict(attrs: List[Tuple[str, Optional[str]]]) -> Dict[str, str]:
    return {k: (v if v is not None else "") for k, v in attrs}


def _normalize_key(key: str) -> str:
    return key.split("___", 1)[0].strip()


def _is_hidden_input(tag: str, attrs: Dict[str, str]) -> bool:
    if tag == "input" and (attrs.get("type", "").lower() == "hidden"):
        return True
    return False


def _is_display_none(attrs: Dict[str, str]) -> bool:
    style = (attrs.get("style") or "").replace(" ", "").lower()
    return "display:none" in style


class _VisualStructureParser(HTMLParser):
    """Parse panels (h4.panel-title) and legends (fieldset/legend) and collect visual fields.

    Goal: group fields by panel and subsection (legend), including sections that may be display:none.
    """

    def __init__(self, retorno_first_row: Dict[str, Any], retorno_child_tables: Dict[str, List[Dict[str, Any]]]):
        super().__init__(convert_charrefs=True)
        self.retorno_first_row = retorno_first_row
        self.retorno_child_tables = retorno_child_tables

        self.labels_for: Dict[str, str] = {}
        self.label_by_base: Dict[str, str] = {}

        self._stack: List[Dict[str, Any]] = []
        self._in_form = False

        self._in_label = False
        self._label_for: Optional[str] = None
        self._label_parts: List[str] = []

        self._in_panel_title = False
        self._panel_title_parts: List[str] = []

        self._in_legend = False
        self._legend_parts: List[str] = []
        self._current_section_title: Optional[str] = None

        self._in_button = False
        self._button_attrs: Dict[str, str] = {}
        self._button_parts: List[str] = []

        self._panel_order = 0
        self.panels: Dict[str, _Panel] = {}
        self._panel_by_dom_id: Dict[str, str] = {}  # dom id -> panel key

        self._dedupe: set[Tuple[str, Optional[str], str]] = set()
        self._table_locations: Dict[str, Tuple[str, Optional[str]]] = {}  # tableid -> (panel_key, section_title)

    def _push(self, tag: str, attrs: Dict[str, str]):
        self._stack.append(
            {
                "tag": tag,
                "attrs": attrs,
                "classes": _classes(attrs),
                "id": (attrs.get("id") or "").strip(),
                "is_panel": tag == "div" and ("panel" in _classes(attrs)),
                "is_form_group": tag == "div" and ("form-group" in _classes(attrs)),
                "fieldset_title": None,
                "panel_key": None,
            }
        )

    def _pop(self, tag: str):
        if not self._stack:
            return
        self._stack.pop()

    def _current_panel_key(self) -> Optional[str]:
        for ctx in reversed(self._stack):
            if ctx.get("panel_key"):
                return ctx["panel_key"]
        return None

    def _current_fieldset_title(self) -> Optional[str]:
        # Prefer the last <legend> seen, even if it isn't inside <fieldset>
        if self._current_section_title:
            return self._current_section_title
        for ctx in reversed(self._stack):
            t = ctx.get("fieldset_title")
            if t:
                return t
        return None

    def _current_child_table(self) -> Optional[str]:
        for ctx in reversed(self._stack):
            t = ctx.get("child_table")
            if t:
                return t
        return None

    def _in_form_group(self) -> bool:
        return any(ctx.get("is_form_group") for ctx in self._stack)

    def _ensure_panel(self, title: str, dom_id: str) -> str:
        title = _clean_text(_fix_mojibake(title))
        if not title:
            title = "(Sem título)"
        key = self._panel_by_dom_id.get(dom_id) or title
        if key not in self.panels:
            self._panel_order += 1
            self.panels[key] = _Panel(title=title, dom_id=dom_id, order=self._panel_order, sections=[], child_tables={})
            if dom_id:
                self._panel_by_dom_id[dom_id] = key
        return key

    def _get_or_create_section(self, panel_key: str, section_title: Optional[str]) -> _PanelSection:
        panel = self.panels[panel_key]
        for sec in panel.sections:
            if sec.title == section_title:
                return sec
        sec = _PanelSection(title=section_title, fields=[])
        panel.sections.append(sec)
        return sec

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]):
        attrs_dict = _attr_dict(attrs)
        if tag == "form":
            self._in_form = True

        if self._in_form:
            self._push(tag, attrs_dict)

        if not self._in_form:
            return

        if tag == "label":
            self._in_label = True
            self._label_for = (attrs_dict.get("for") or "").strip() or None
            self._label_parts = []
            return

        if tag in {"h1", "h2", "h3", "h4", "h5"}:
            if "panel-title" in _classes(attrs_dict):
                self._in_panel_title = True
                self._panel_title_parts = []
            return

        if tag == "legend":
            self._in_legend = True
            self._legend_parts = []
            return

        if tag == "button":
            self._in_button = True
            self._button_attrs = attrs_dict
            self._button_parts = []
            return

        if tag == "table":
            # Map child table location by where it appears in the HTML
            table_id = (attrs_dict.get("id") or attrs_dict.get("name") or "").strip()
            table_id = _normalize_key(table_id)
            if table_id and table_id in self.retorno_child_tables:
                # mark context so we don't list its fields as parent fields
                if self._stack:
                    self._stack[-1]["child_table"] = table_id
                panel_key = self._current_panel_key()
                if panel_key:
                    section_title = self._current_fieldset_title()
                    self._table_locations[table_id] = (panel_key, section_title)
            return

        if tag in {"input", "select", "textarea"}:
            if _is_hidden_input(tag, attrs_dict):
                return

            # If we're inside a child table, skip listing as a "parent" field.
            if self._current_child_table():
                return

            raw_key = (attrs_dict.get("id") or attrs_dict.get("name") or "").strip()
            if not raw_key:
                return
            field_id = _normalize_key(raw_key)

            # Visual heuristics:
            # - field has a label OR is inside a .form-group
            # - keep even if display:none on container; only skip if element itself is a hidden control
            label = (
                self.labels_for.get(raw_key)
                or self.labels_for.get(field_id)
                or ""
            )
            label = _clean_text(_fix_mojibake(label))

            cls = _classes(attrs_dict)
            looks_like_control = (
                ("form-control" in cls)
                or (tag in {"select", "textarea"})
                or ((attrs_dict.get("type") or "").lower() == "zoom")
            )
            is_visual = bool(label) or (self._in_form_group() and looks_like_control)

            # If element itself is display:none and has no label, treat as control
            if _is_display_none(attrs_dict) and not label:
                is_visual = False

            if not is_visual:
                return

            panel_key = self._current_panel_key()
            if not panel_key:
                return
            section_title = self._current_fieldset_title()

            if not label:
                placeholder = (attrs_dict.get("placeholder") or "").strip()
                label = _clean_text(_fix_mojibake(placeholder)) or _humanize_key(field_id)

            dedupe_key = (panel_key, section_title, field_id)
            if dedupe_key in self._dedupe:
                return
            self._dedupe.add(dedupe_key)

            sec = self._get_or_create_section(panel_key, section_title)
            sec.fields.append((label, field_id))
            return

        if tag == "input":
            # buttons as input type
            t = (attrs_dict.get("type") or "").lower()
            if t in {"button", "submit"}:
                raw_key = (attrs_dict.get("id") or attrs_dict.get("name") or "").strip()
                if not raw_key:
                    return
                field_id = _normalize_key(raw_key)
                label = _clean_text(_fix_mojibake(attrs_dict.get("value") or "")) or _humanize_key(field_id)

                panel_key = self._current_panel_key()
                if not panel_key:
                    return
                section_title = self._current_fieldset_title()
                dedupe_key = (panel_key, section_title, field_id)
                if dedupe_key in self._dedupe:
                    return
                self._dedupe.add(dedupe_key)
                sec = self._get_or_create_section(panel_key, section_title)
                sec.fields.append((label, field_id))
                return

    def handle_endtag(self, tag: str):
        if not self._in_form:
            return

        if self._in_label and tag == "label":
            label_text = _clean_text(_fix_mojibake("".join(self._label_parts)))
            if self._label_for and label_text:
                self.labels_for[self._label_for] = label_text
                base = _normalize_key(self._label_for)
                # Keep first-seen label for a base id; typically matches what user sees.
                self.label_by_base.setdefault(base, label_text)
            self._in_label = False
            self._label_for = None
            self._label_parts = []
            return

        if self._in_panel_title and tag in {"h1", "h2", "h3", "h4", "h5"}:
            title_text = _clean_text(_fix_mojibake("".join(self._panel_title_parts)))

            # Assign to nearest open panel div
            panel_dom_id = ""
            for ctx in reversed(self._stack):
                if ctx.get("is_panel"):
                    panel_dom_id = ctx.get("id") or ""
                    panel_key = self._ensure_panel(title_text, panel_dom_id)
                    ctx["panel_key"] = panel_key
                    # reset subsection when a new panel starts
                    self._current_section_title = None
                    break

            self._in_panel_title = False
            self._panel_title_parts = []
            return

        if self._in_legend and tag == "legend":
            legend_text = _clean_text(_fix_mojibake("".join(self._legend_parts)))
            if legend_text:
                self._current_section_title = legend_text
                # attach to nearest fieldset
                for ctx in reversed(self._stack):
                    if ctx.get("tag") == "fieldset":
                        ctx["fieldset_title"] = legend_text
                        break
            self._in_legend = False
            self._legend_parts = []
            return

        if self._in_button and tag == "button":
            raw_key = (self._button_attrs.get("id") or self._button_attrs.get("name") or "").strip()
            if raw_key:
                field_id = _normalize_key(raw_key)
                label = _clean_text(_fix_mojibake("".join(self._button_parts)))
                if not label:
                    label = _clean_text(_fix_mojibake(self._button_attrs.get("value") or ""))
                if not label:
                    label = _humanize_key(field_id)

                panel_key = self._current_panel_key()
                if panel_key:
                    section_title = self._current_fieldset_title()
                    dedupe_key = (panel_key, section_title, field_id)
                    if dedupe_key not in self._dedupe:
                        self._dedupe.add(dedupe_key)
                        sec = self._get_or_create_section(panel_key, section_title)
                        sec.fields.append((label, field_id))

            self._in_button = False
            self._button_attrs = {}
            self._button_parts = []
            return

        if tag == "form":
            self._in_form = False

        self._pop(tag)

    def handle_data(self, data: str):
        if self._in_label:
            self._label_parts.append(data)
            return
        if self._in_panel_title:
            self._panel_title_parts.append(data)
            return
        if self._in_legend:
            self._legend_parts.append(data)
            return
        if self._in_button:
            self._button_parts.append(data)
            return

    def finalize_child_table_attachment(self):
        # Attach dataset child tables into the panel where the table appears.
        for tableid, (panel_key, section_title) in self._table_locations.items():
            if panel_key not in self.panels:
                continue
            keys = child_table_fields(self.retorno_child_tables.get(tableid, []))
            self.panels[panel_key].child_tables[tableid] = keys


def write_output_visual_by_panel(
    html_text: str,
    retorno_first: Dict[str, Any],
    retorno_child_tables: Dict[str, List[Dict[str, Any]]],
    output_path: Path,
):
    parser = _VisualStructureParser(retorno_first, retorno_child_tables)
    parser.feed(html_text)
    parser.finalize_child_table_attachment()

    panels_sorted = sorted(parser.panels.values(), key=lambda p: p.order)

    lines: List[str] = []
    lines.append("LISTA DE CAMPOS VISUAIS - POR PAINEL (FORMULÁRIO ADMISSÃO)")
    lines.append(f"Fonte HTML: {HTML_PATH.name}")
    lines.append(f"Fonte retorno dataset: {RETORNO_PATH.name}")
    lines.append("")
    lines.append("(formato: NOME DO CAMPO - ID DO CAMPO)")
    lines.append("Obs: inclui seções que podem estar display:none, desde que sejam campos de utilidade ao usuário.")

    for panel in panels_sorted:
        # Skip the form main title panel if it doesn't have fields
        has_any_fields = any(sec.fields for sec in panel.sections) or bool(panel.child_tables)
        if not has_any_fields:
            continue

        lines.append("\n" + "=" * 80)
        lines.append(f"PAINEL: {panel.title}")
        if panel.dom_id:
            lines.append(f"ID DO PAINEL: {panel.dom_id}")

        # Sections in appearance order
        for sec in panel.sections:
            if not sec.fields:
                continue
            if sec.title:
                lines.append("-" * 15)
                lines.append(sec.title)
            for label, field_id in sec.fields:
                lines.append(f"{label} - {field_id}")

        # Child tables
        for tableid in sorted(panel.child_tables.keys()):
            keys = panel.child_tables[tableid]
            if not keys:
                continue
            lines.append("-" * 15)
            lines.append(f"TABELA FILHO: {tableid}")
            for k in keys:
                label = parser.label_by_base.get(k) or parser.label_by_base.get(_normalize_key(k))
                if not label:
                    label = _humanize_key(k)
                lines.append(f"{label} - {tableid}.{k}")

    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_html_fields(html_text: str) -> Tuple[Dict[str, str], List[Field]]:
    parser = _FormHTMLParser()
    parser.feed(html_text)

    labels_for = parser.labels_for

    fields: List[Field] = []
    seen: set[str] = set()

    for f in parser.fields_in_order:
        raw_key = (f.get("id") or f.get("name") or "").strip()
        if not raw_key or raw_key in seen:
            continue
        seen.add(raw_key)

        base_id = raw_key.split("___", 1)[0]

        label = (
            labels_for.get(raw_key)
            or labels_for.get(base_id)
            or labels_for.get((f.get("name") or "").strip())
            or ""
        )
        if not label:
            placeholder = (f.get("placeholder") or "").strip()
            label = placeholder if placeholder else _humanize_key(base_id)

        label = _fix_mojibake(label)

        fields.append(
            Field(
                label=_clean_text(_fix_mojibake(label)) or _humanize_key(base_id),
                field_id=base_id,
                raw_key=raw_key,
                name=(f.get("name") or "").strip(),
                tag=(f.get("tag") or "").strip(),
                input_type=(f.get("type") or "").strip(),
                placeholder=(f.get("placeholder") or "").strip(),
                in_child_row=("___" in raw_key),
            )
        )

    return labels_for, fields


def load_retorno(path: Path) -> Any:
    text = path.read_text(encoding="utf-8", errors="replace").strip()
    return json.loads(text)


def _try_parse_json_string(value: str) -> Optional[Any]:
    s = value.strip()
    if not s:
        return None
    if not ((s.startswith("[") and s.endswith("]")) or (s.startswith("{") and s.endswith("}"))):
        return None
    try:
        return json.loads(s)
    except Exception:
        return None


def parse_child_tables_from_retorno(first_row: Dict[str, Any]) -> Dict[str, List[Dict[str, Any]]]:
    child_tables: Dict[str, List[Dict[str, Any]]] = {}

    for key, value in first_row.items():
        if not isinstance(value, str):
            continue
        parsed = _try_parse_json_string(value)
        if not parsed:
            continue
        if isinstance(parsed, list) and parsed and isinstance(parsed[0], dict) and "tableid" in parsed[0]:
            table_id = str(parsed[0].get("tableid") or key)
            child_tables[table_id] = parsed

    return child_tables


def child_table_fields(rows: List[Dict[str, Any]]) -> List[str]:
    meta = {"ID", "companyid", "cardid", "documentid", "version", "tableid", "masterid"}
    keys: set[str] = set()
    for row in rows:
        keys.update(row.keys())
    return sorted([k for k in keys if k not in meta])


def write_output(
    fields: List[Field],
    retorno_first: Dict[str, Any],
    child_tables: Dict[str, List[Dict[str, Any]]],
    output_path: Path,
):
    dataset_keys = set(retorno_first.keys())

    # Keep appearance order from HTML; list base ids only once.
    seen_base: set[str] = set()
    parent_lines: List[str] = []
    for f in fields:
        if not f.field_id or f.in_child_row:
            continue
        if f.field_id in seen_base:
            continue
        seen_base.add(f.field_id)

        # If the field doesn't exist in dataset keys, still list it (it is used in form)
        parent_lines.append(f"{f.label} - {f.field_id}")

    # Child tables: prioritize what dataset returns
    child_sections: List[str] = []
    for table_id in sorted(child_tables.keys()):
        keys = child_table_fields(child_tables[table_id])
        if not keys:
            continue
        child_sections.append(f"\nTABELA FILHO: {table_id}")
        for k in keys:
            child_sections.append(f"{_humanize_key(k)} - {table_id}.{k}")

    # Also list any child-like HTML fields (___) that are not present in retorno (rare)
    html_child_bases = sorted({f.field_id for f in fields if f.in_child_row and f.field_id})
    if html_child_bases:
        child_sections.append("\nCAMPOS COM ___ (ENCONTRADOS NO HTML)")
        for base in html_child_bases:
            child_sections.append(f"{_humanize_key(base)} - {base}")

    header = [
        "LISTA DE CAMPOS - FORMULÁRIO ADMISSÃO",
        f"Fonte HTML: {HTML_PATH.name}",
        f"Fonte retorno dataset: {RETORNO_PATH.name}",
        "",
        "(formato: NOME DO CAMPO - ID DO CAMPO)",
        "",
        "CAMPOS (PAI)",
    ]

    content = "\n".join(header + parent_lines + child_sections) + "\n"
    output_path.write_text(content, encoding="utf-8")


def main():
    html_text = _read_html_best_effort(HTML_PATH)
    _, fields = parse_html_fields(html_text)

    retorno = load_retorno(RETORNO_PATH)
    if not isinstance(retorno, list) or not retorno or not isinstance(retorno[0], dict):
        raise SystemExit("admissao-retorno não está no formato esperado (lista de objetos).")

    first = retorno[0]
    child_tables = parse_child_tables_from_retorno(first)

    write_output(fields, first, child_tables, OUTPUT_PATH)

    # Visual-only, organized output
    write_output_visual_by_panel(html_text, first, child_tables, OUTPUT_VISUAL_PATH)

    print(f"Campos extraídos do HTML: {len(fields)}")
    print(f"Chaves no 1º registro do retorno: {len(first.keys())}")
    print(f"Tabelas filho detectadas no retorno: {', '.join(sorted(child_tables.keys())) or 'nenhuma'}")
    print(f"Arquivo gerado: {OUTPUT_PATH}")
    print(f"Arquivo gerado (visual por painel): {OUTPUT_VISUAL_PATH}")


if __name__ == "__main__":
    main()
