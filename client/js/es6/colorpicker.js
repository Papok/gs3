import * as html from "./html_classes.js";
import tinycolorpicker from "/tinycolorpicker/lib/tinycolorpicker.js";


class colorpicker extends html.div {
  constructor(parent) {
    console.log("cp_constructor");
    let e_1_1 = new html.active_html_base(
      "autoparent",
      "div",
      "",
      new Map([["class", "colorInner"]])
    );
    let e_1 = new html.active_html_base(
      "autoparent",
      "a",
      e_1_1,
      new Map([["class", "color"]])
    );
    let e_2 = new html.active_html_base(
      "autoparent",
      "div",
      "",
      new Map([["class", "track"]])
    );
    let e_3_1 = new html.active_html_base("autoparent", "li", "");
    let e_3 = new html.active_html_base(
      "autoparent",
      "ul",
      e_3_1,
      new Map([["class", "dropdown"]])
    );
    let e_4 = new html.active_html_base(
      "autoparent",
      "input",
      "",
      new Map([["type", "hidden"], ["class", "colorInput"]])
    );
    let inner = [e_1, e_2, e_3, e_4];
    //   '<a class="color"><div class="colorInner"></div></a><div class="track"></div><ul class="dropdown"><li></li></ul><input type="hidden" class="colorInput"/>';
    super(parent, inner);
  }

  draw() {
    console.log("cp_draw1");
    super.draw();
    console.log("cp_draw2");
    let $picker = document.getElementById(this.id);
    console.log($picker);
    this.picker = tinycolorpicker($picker);
  }
}

export default colorpicker;
