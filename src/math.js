import katex from '../vendor/katex/katex.mjs';

// Keep editable LaTeX source in the markup; render both visual HTML and accessible MathML.
document.querySelectorAll('[data-tex]').forEach(element => {
  katex.render(element.dataset.tex, element, {
    displayMode: element.classList.contains('equation'),
    throwOnError: true,
    trust: false,
    output: 'htmlAndMathml'
  });
});
