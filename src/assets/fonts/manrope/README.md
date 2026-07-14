# Manrope (self-hosted)

Manrope by The Manrope Project Authors, licensed under the SIL Open Font
License, Version 1.1 (see `OFL.txt` in this directory).

These WOFF2 files are static-weight instances (400, 500, 700, 800) generated
from the upstream variable font
[`ofl/manrope/Manrope[wght].ttf`](https://github.com/google/fonts/tree/main/ofl/manrope)
(commit `ec0464b978de222073645d6d3366f3fdf03376d8`) using `fonttools`:

```sh
python3 -m fontTools.varLib.instancer -o Manrope-<weight>.ttf "Manrope[wght].ttf" wght=<weight>
```

followed by WOFF2 compression via `fontTools.ttLib`. No modification other than
weight instancing and format conversion was made to the glyph outlines. All
assets are served locally by this application; no request is made to Google
Fonts or any other external font origin.
