class Util {
    static q(root, selector) {
        if (!root) return null;
        return root.querySelector(selector);
    }

    static qa(root, selector) {
        if (!root) return [];
        return Array.from(root.querySelectorAll(selector));
    }

    static setValue(root, selector, value) {
        const el = Util.q(root, selector);
        if (!el) return;
        el.value = value == null ? "" : String(value);
    }

    static setChecked(root, selector, checked) {
        const el = Util.q(root, selector);
        if (!el) return;
        el.checked = !!checked;
    }

    static fillList(root, selector, items, emptyLabel) {
        const ul = Util.q(root, selector);
        if (!ul) return;

        ul.innerHTML = "";
        if (Array.isArray(items) && items.length > 0) {
            items.forEach((item) => {
                const li = document.createElement("li");
                li.textContent = String(item);
                ul.appendChild(li);
            });
            return;
        }

        const li = document.createElement("li");
        li.textContent = emptyLabel || "Nenhum item informado";
        ul.appendChild(li);
    }
}
