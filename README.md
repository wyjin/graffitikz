# graffitikz

A simple 2D vector shape editor that supports TikZ output. [Work in progress](todo.txt).

### To use

A demo is hosted at [https://graffitikz.wnyjin.com](https://graffitikz.wnyjin.com)

[Getting Started](help.md)

### To host/modify

- Make sure [node.js](https://nodejs.org/en/) is installed.
- Clone this repository.
- Run `npm install` to install the dependencies. Then,
  - run `npm run dev` for development.
  - run `npm run build` to build the project. Artifacts will be located in `build/` directory. (To host from a subdirectory, the webpack environment needs to be changed. See [this stackoverflow answer](https://stackoverflow.com/a/50076588) for the configurations.)
  - run `npm run serve` to host.

### Known Issues

- Shift-Cmd-Z (redo) does not register in Firefox on macOS. This can be fixed via creating shortcuts in system preferences (see [this bugzilla thread](https://bugzilla.mozilla.org/show_bug.cgi?id=429824) for details or [this stackexchange thread](https://apple.stackexchange.com/questions/342978/why-shift-cmd-n-fails-as-a-custom-shortcut-for-firefox-new-private-window) for a summary). Use Cmd-Y instead for now.

### References

- Used code from [yishn/tikzcd-editor](https://github.com/yishn/tikzcd-editor) for the `CodeBox` and `ToolBox` components.
- Used code from [mathjax/MathJax-demos-node](https://github.com/mathjax/MathJax-demos-node/blob/master/direct/tex2svg) for rendering TeX.

