const path = require("path");

/** @type {(c: import('@babel/types').Comment[]|null|undefined, needle:string)=>boolean} */
const hasPragma = (c, needle) => !!c?.some((x) => x.value.includes(needle));

/** @type {(s: import('@babel/core').PluginPass)=>boolean} */
const fileHasIgnorePragma = (s) => {
  const ast = s.file.ast;
  const all = ast.comments;
  return hasPragma(all, "@babel-ignore babel-plugin-react-dom-portal-shim");
};

/** @type {(p: import('@babel/traverse').NodePath<any>, s: import('@babel/core').PluginPass)=>boolean} */
const nodeHasIgnorePragma = (p, s) => {
  const n = p.node;
  const lc = n.leadingComments;
  return (
    hasPragma(lc, "@babel-ignore babel-plugin-react-dom-portal-shim") ||
    fileHasIgnorePragma(s)
  );
};

/** @type {(n: import('@babel/types').StringLiteral | null | undefined, s: import('@babel/core').PluginPass, shim:string, p: import('@babel/traverse').NodePath<any>)=>void} */
const rewriteIfReactDom = (n, s, shim, p) => {
  if (!n) return;
  if (n.value !== "react-dom") return;
  if (nodeHasIgnorePragma(p, s)) return;
  n.value = shim;
};

/** @type {() => import('@babel/core').PluginObj} */
function portalShim() {
  const shimAbs = path.resolve(
    process.cwd(),
    "src/content/shadow-portal/react-dom-portal-shim.js",
  );
  return {
    name: "react-dom-portal-shim",
    visitor: {
      ImportDeclaration(p, state) {
        rewriteIfReactDom(p.node.source, state, shimAbs, p);
      },
      CallExpression(p, state) {
        const c = p.node.callee;
        if (c.type === "Import" && p.node.arguments.length === 1) {
          const arg = p.node.arguments[0];
          if (arg && arg.type === "StringLiteral")
            rewriteIfReactDom(arg, state, shimAbs, p);
        }
      },
    },
  };
}

module.exports = portalShim;
