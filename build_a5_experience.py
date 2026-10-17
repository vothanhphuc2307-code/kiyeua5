#!/usr/bin/env python3
"""Rebuild the A5 Experience Suite bundles from the checked-in source modules."""
from pathlib import Path
ROOT = Path(__file__).resolve().parent
JS = ROOT / 'a5-experience-src' / 'js'
CSS = ROOT / 'a5-experience-src' / 'css'
js_files = sorted(JS.glob('*.js'))
css_files = sorted(CSS.glob('*.css'))
if not js_files or js_files[0].name != '00-runtime.js':
    raise SystemExit('Missing 00-runtime.js as the first module.')
js = js_files[0].read_text(encoding='utf-8')
for path in js_files[1:]: js += '\n/* ===== ' + path.name + ' ===== */\n' + path.read_text(encoding='utf-8')
js += '\n(function(){const api=window.A5ExperienceSuite;if(!api)return;const run=()=>api.start();if(document.readyState===\'loading\')document.addEventListener(\'DOMContentLoaded\',run,{once:true});else run();})();\n'
(ROOT / 'a5-experience-suite.js').write_text(js, encoding='utf-8')
css = '\n\n'.join('/* ===== ' + path.name + ' ===== */\n' + path.read_text(encoding='utf-8') for path in css_files)
(ROOT / 'a5-experience-suite.css').write_text(css, encoding='utf-8')
print('Built', len(js_files), 'JavaScript source modules and', len(css_files), 'CSS source modules.')
