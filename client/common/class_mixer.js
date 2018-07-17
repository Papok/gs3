/* global $ */

class MixinBiulder {
    constructor(superclass) {
        this.superclass = superclass;
    }

    with(...mixins) {
        return mixins.reduce((c, mixin) => mixin(c), this.superclass);
    }
}

let mix = (superclass) => new MixinBiulder(superclass);

let form_field = (superclass) => class extends superclass {
    on_change(f) {
        $(this.selector).change(function() {
            f();
        });
    }
    on_input(f) {
        $(this.selector).on("input", function() {
            f();
        });
    }

    get value() {
        return $(this.selector).val();
    }
};

export { MixinBiulder, mix, form_field };
