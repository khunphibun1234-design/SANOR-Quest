# Source for bundled files

`home/table-three.js` is built from `src/table-three.js` with Three.js r187 (MIT, https://github.com/mrdoob/three.js, tag `r187`).

```
git clone --depth 1 --branch r187 https://github.com/mrdoob/three.js /tmp/three
esbuild src/table-three.js --bundle --minify --format=iife --target=es2019 \
  --alias:three=/tmp/three/build/three.module.js --alias:three-addons=/tmp/three/examples/jsm \
  --legal-comments=eof --outfile=home/table-three.js
```

`home/table-three.html` is the Three.js prototype (path B). Devices without WebGL are sent to `home/table3d.html` (path A).
