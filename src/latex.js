const { mathjax } = require('mathjax-full/js/mathjax.js');
const { TeX } = require('mathjax-full/js/input/tex.js');
const { SVG } = require('mathjax-full/js/output/svg.js');
const { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor.js');
const { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html.js');

const { AllPackages } = require('mathjax-full/js/input/tex/AllPackages.js');

export default function TeXToSVG(str) {
    const INLINE = true, packages = AllPackages.sort();

    const adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);

    const tex = new TeX({ packages });
    const svg = new SVG({ fontCache: 'local'});
    const html = mathjax.document('', { InputJax: tex, OutputJax: svg });

    const node = html.convert(str, {display: !INLINE})
    return adaptor.innerHTML(node)
}
