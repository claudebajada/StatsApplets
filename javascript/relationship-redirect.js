/* Preserve bookmarks from the former all-in-one explorer on static hosts. */
(() => {
  const query = new URLSearchParams(location.search);
  const keys = [
    "df1",
    "df2",
    "sampleSize",
    "sampleSize2",
    "groups",
    "categories",
    "observations",
    "seed",
    "repetitions",
    "shown",
    "inspected",
    "traceStep",
  ];
  const kind = query.get("relationship");
  if (!query.has("relationship") && !keys.some((key) => query.has(key))) return;
  const selected = query.has("relationship") ? kind : "squares";
  const lesson = Object.hasOwn(RelationshipContent.byMode, selected)
    ? RelationshipContent.byMode[selected]
    : null;
  if (!lesson) {
    history.replaceState(null, "", location.pathname + location.hash);
    return;
  }
  const target = new URL(lesson.id + ".html", location.href);
  const mode = RelationshipContent.modes[lesson.relationship];
  const allowed = [
    ...mode.params,
    "seed",
    "repetitions",
    "shown",
    "inspected",
    "traceStep",
  ];
  for (const key of allowed)
    if (query.has(key)) target.searchParams.set(key, query.get(key));
  if (
    ["#relationship-trace", "#guided-lab", "#map-title", "#main"].includes(
      location.hash,
    )
  )
    target.hash = location.hash;
  location.replace(target.href);
})();
