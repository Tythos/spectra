/**
 * @author <code@tythos.net>
 */

const interpModeMap = {
    "Linear RGB": (rgbi, rgbf, n) => {
        let colors = [];
        for (let i = 0; i < n; i += 1) {
            let r = rgbi[0] + i / (n - 1) * (rgbf[0] - rgbi[0]);
            let g = rgbi[1] + i / (n - 1) * (rgbf[1] - rgbi[1]);
            let b = rgbi[2] + i / (n - 1) * (rgbf[2] - rgbi[2]);
            colors.push([r, g, b]);
        }
        return colors;
    },
    "Linear HSL": (rgbi, rgbf, n) => {
        let hsli = conversions.toHSL(rgbi);
        let hslf = conversions.toHSL(rgbf);
        let colors = [];
        for (let i = 0; i < n; i += 1) {
            let h = hsli[0] + i / (n - 1) * (hslf[0] - hsli[0]);
            let s = hsli[1] + i / (n - 1) * (hslf[1] - hsli[1]);
            let l = hsli[2] + i / (n - 1) * (hslf[2] - hsli[2]);
            colors.push(conversions.fromHSL([h, s, l]));
        }
        return colors;
    }
};

const conversions = { // to/from 0-1 rgb array
    "toHSL": (rgb) => {
        let x_max = Math.max(...rgb);
        let x_min = Math.min(...rgb);
        let c = x_max - x_min;
        let l = (x_max + x_min) * 0.5;
        let h = 0;
        let v = x_max;
        let r = rgb[0], g = rgb[1], b = rgb[2];
        if (c == 0) {
            h = 0;
        } else if (v === rgb[0]) {
            h = 60 * (0 + (g - b) / c);
        } else if (v === rgb[1]) {
            h = 60 * (2 + (b - r) / c);
        } else if (v === rgb[2]) {
            h = 60 * (4 + (r - g) / c);
        }
        let s = 0;
        if (v > 0) {
            s = c / v;
        }
        return [h, s, l];
    },
    "fromHSL": (hsv) => {
        // h E [0,360]deg; s E [0,1], l E [0,1]
        let h = hsv[0];
        let s = hsv[1];
        let l = hsv[2];
        let c = (1 - Math.abs(2 * l - 1)) * s;
        let h_ = h / 60;
        let x = c * (1 - Math.abs(h_ % 2 - 1));
        let r = 0, g = 0, b = 0;
        if (0 <= h_ && h_ < 1) {
            r = c;
            g = x;
            b = 0;
        } else if (1 <= h_ && h_ < 2) {
            r = x;
            g = c;
            b = 0;
        } else if (2 <= h_ && h_ < 3) {
            r = 0;
            g = c;
            b = x;
        } else if (3 <= h_ && h_ < 4) {
            r = 0;
            g = x;
            b = c;
        } else if (4 <= h_ && h_ < 5) {
            r = x;
            g = 0;
            b = c;
        } else if (5 <= h_ && h_ < 6) {
            r = c;
            g = 0;
            b = x;
        }
        let m = l - 0.5 * c;
        return [r + m, g + m, b + m];
    }
}

function renderColorFacets(color) {
    let div = window.document.createElement("div");
    { // rgb
        let span = window.document.createElement("span");
        span.textContent = `RGB: ${[
            Math.floor(color[0] * 255).toFixed(0),
            Math.floor(color[1] * 255).toFixed(0),
            Math.floor(color[2] * 255).toFixed(0)
        ]}`;
        div.appendChild(span);
    } {
        // hsl
        let span = window.document.createElement("span");
        let hsl = conversions.toHSL(color);
        span.innerHTML = `HSL: ${hsl[0].toFixed(0)}&deg;, ${hsl[1].toFixed(2)}, ${hsl[2].toFixed(2)}`;
        div.appendChild(span);
    } {
        // hex
        let span = window.document.createElement("span");
        let r = Math.floor(color[0] * 255).toString(16);
        let g = Math.floor(color[1] * 255).toString(16);
        let b = Math.floor(color[2] * 255).toString(16);
        span.textContent = `hex: #${r.length > 1 ? r : "0" + r}${g.length > 1 ? g : "0" + g}${b.length > 1 ? b : "0" + b}`;
        div.appendChild(span);
    }
    return div;
}

function onSpectraUpdate() {
    // get interpolation inputs
    let init = window.document.querySelector(".InitColor").querySelector("input").value;
    let final = window.document.querySelector(".FinalColor").querySelector("input").value;
    let nSteps = parseInt(window.document.querySelector(".NumberSteps").querySelector("input").value);

    // clear existing samples
    let destCol = window.document.querySelector(".Column1");
    destCol.innerHTML = "";

    // translate colors into 0-1 rgb
    let ri = parseInt(init.slice(1, 3), 16) / 255;
    let gi = parseInt(init.slice(3, 5), 16) / 255;
    let bi = parseInt(init.slice(5, 7), 16) / 255;
    let rf = parseInt(final.slice(1, 3), 16) / 255;
    let gf = parseInt(final.slice(3, 5), 16) / 255;
    let bf = parseInt(final.slice(5, 7), 16) / 255;

    // resolve interpolator from selection, and invoke
    let interpolator = window.document.querySelector(".InterpMode").querySelector("select").value;
    let colors = interpModeMap[interpolator]([ri, gi, bi], [rf, gf, bf], nSteps);

    // render output colors to RHS
    colors.forEach(color => {
        let input = window.document.createElement("input");
        let r = Math.floor(color[0] * 255).toString(16);
        let g = Math.floor(color[1] * 255).toString(16);
        let b = Math.floor(color[2] * 255).toString(16);
        input.type = "color";
        input.disabled = true;
        input.value = `#${r.length > 1 ? r : "0" + r}${g.length > 1 ? g : "0" + g}${b.length > 1 ? b : "0" + b}`;
        destCol.appendChild(input);
        destCol.appendChild(renderColorFacets(color));
    });

    // update annotation for initial color
    let initAnno = window.document.querySelector(".InitColor").querySelector("div");
    initAnno.innerHTML = "";
    initAnno.appendChild(renderColorFacets([ri, gi, bi]));

    // update annotation for final color
    let finalAnno = window.document.querySelector(".FinalColor").querySelector("div");
    finalAnno.innerHTML = "";
    finalAnno.appendChild(renderColorFacets([rf, gf, bf]));
}

function onWindowLoaded(event) {
    window.document.querySelector(".Execute").addEventListener("click", onSpectraUpdate);
    Array.from(window.document.querySelectorAll("input")).forEach(input => {
        input.addEventListener("change", onSpectraUpdate);
    });
    window.document.querySelector("select").addEventListener("change", onSpectraUpdate);
    onSpectraUpdate();
}

window.addEventListener("load", onWindowLoaded);
