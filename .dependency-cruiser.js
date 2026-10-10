// Rules for dependency-cruiser (MIT). CLAUDE.md, "The engine knows no place":
// engine code (src/ and tools/) never imports place data (places/). To add a
// town you add a file in places/; if engine code had to read one, the engine is wrong.
/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    {
      name: "engine-knows-no-place",
      comment: "Engine code must not import place-specific data. Read a place through its file, passed in.",
      severity: "error",
      from: { path: "^(src|tools)/" },
      to: { path: "^places/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
