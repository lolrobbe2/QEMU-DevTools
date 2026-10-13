const esbuild = require("esbuild");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function main() {
	const common = {
		bundle: true,
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		logLevel: "silent",
		plugins: [esbuildProblemMatcherPlugin],
	};

	const contexts = await Promise.all([
		esbuild.context({
			...common,
			entryPoints: ["src/extension.ts"],
			format: "cjs",
			platform: "node",
			outfile: "dist/extension.js",
			external: ["vscode"],
		}),

		esbuild.context({
			...common,
			entryPoints: ["src/webview.js"],
			format: "esm",
			platform: "browser",
			outfile: "dist/webview.js",
		}),
	]);

	if (watch) {
		await Promise.all(contexts.map((ctx) => ctx.watch()));
	} else {
		try {
			await Promise.all(contexts.map((ctx) => ctx.rebuild()));
		} finally {
			await Promise.all(contexts.map((ctx) => ctx.dispose()));
		}
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
