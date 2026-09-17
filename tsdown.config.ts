/**
 * Self-contained tsdown build for the completion-sound bundle. It produces the
 * node-half library (lib/index.js + lib/invariant.js) from the tsc-emitted
 * `lib/types` entries and the browser client bundle (lib/client.js) from
 * `src/client/index.ts`. Run `tsc -p tsconfig.json` first, then this config —
 * the `build` script chains both.
 *
 * The client bundle emits a closure-factory artifact: it calls
 * `window.__ModuleLoader__.load({ id, factory })` and resolves externals through
 * the injected require (the shell's frozen module table). CSS Modules are
 * compiled by lightningcss inline: importing `x.module.css` yields the hashed
 * class map, and the css auto-injects a `<style data-plugin>` tag at factory
 * execution.
 */
import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve as resolvePath } from 'node:path'
import { transform } from 'lightningcss'
import type { UserConfig } from 'tsdown'

/** Plugin id stamped into the loader handoff and the injected style tags. */
const ID = '@jensentsts/dsh-completion-sound'

/** Browser platform modules the shell shares into the frozen module table. */
const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
] as const

/** Externals resolved from the loader module table (platform seed). */
const CLIENT_EXTERNALS: readonly string[] = [...PLATFORM_MODULES]

/** Vendored framework libraries: ordinary libraries a browser bundle inlines. */
const VENDORED_LIBRARY = /^@deepseek-ai\/(cosmokit|schemastery)(\/|$)/
/** Wire/type layers a client bundle may inline. */
const INLINE_SAFE = /^@deepseek-ai\/dsh-(host-apiproxy|session|llm|tools|brand)(\/|$)/
/** Generated descriptor/codec contribution with no shared runtime identity. */
const GENERATED_REMOTE = /^@deepseek-ai\/dsh-[a-z0-9]+(?:-[a-z0-9]+)*\/remote$/

const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

/** Resolve an emitted CSS asset import against its source-tree counterpart. */
function sourceAssetPath(source: string, importer: string | undefined): string {
  return importer !== undefined ? resolvePath(dirname(importer), source) : source
}

/**
 * Bundle purity gate (build-time mirror of the module-edge rules): platform
 * seed entries stay external, inline-safe wire layers inline, and every other
 * @deepseek-ai value import is a build error — a cross-plugin value import
 * either inlines a duplicate runtime instance or requires a specifier the
 * frozen module table cannot answer.
 */
const purityPlugin = {
  name: 'dsh-client-bundle-purity',
  resolveId(source: string) {
    if (!source.startsWith('@deepseek-ai/')) return null
    if (CLIENT_EXTERNALS.includes(source)) return null
    if (VENDORED_LIBRARY.test(source)) return null
    if (INLINE_SAFE.test(source) || GENERATED_REMOTE.test(source)) return null
    throw new Error(
      `client bundle purity: "${source}" is not a platform module (CLIENT_EXTERNALS), an inline-safe wire layer, or a generated /remote contribution — `
      + 'cross-plugin value imports are forbidden; collaborate through cordis services (type-only imports are erased and never reach this gate)',
    )
  },
}

/** Inline CSS Modules via lightningcss; one <style data-plugin> per module file. */
const cssModulesPlugin = {
  name: 'dsh-css-modules-inline',
  resolveId(source: string, importer: string | undefined) {
    if (!source.endsWith('.module.css')) return null
    const abs = importer !== undefined ? sourceAssetPath(source, importer) : source
    return CSS_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
  },
  async load(virtualId: string) {
    if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
    const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
    this.addWatchFile(fileId)
    const source = await readFile(fileId)
    const { code, exports: cssExports } = transform({
      filename: fileId,
      code: source,
      cssModules: { pattern: '[hash]_[local]' },
      minify: true,
    })
    const classMap: Record<string, string> = {}
    for (const [local, exp] of Object.entries(cssExports ?? {})) classMap[local] = exp.name
    return [
      `const css = ${JSON.stringify(code.toString())};`,
      `const tagId = ${JSON.stringify(`${ID}/${basename(fileId)}`)};`,
      'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
      '  const tag = document.createElement(\'style\');',
      `  tag.dataset.plugin = ${JSON.stringify(ID)};`,
      '  tag.dataset.pluginCss = tagId;',
      '  tag.textContent = css;',
      '  document.head.appendChild(tag);',
      '}',
      `export default ${JSON.stringify(classMap)};`,
    ].join('\n')
  },
}

export default [
  {
    name: ID,
    entry: ['lib/types/index.js', 'lib/types/invariant.js'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
  } satisfies UserConfig,
  {
    name: `${ID}/client`,
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    external: [...CLIENT_EXTERNALS],
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
    noExternal: (id: string) => (CLIENT_EXTERNALS.includes(id) ? undefined : true),
    plugins: [purityPlugin, cssModulesPlugin],
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  } satisfies UserConfig,
]
