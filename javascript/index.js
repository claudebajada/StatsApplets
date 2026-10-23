const root = document.getElementById("catalogue");
function renderCatalogue() {
  const query = document.getElementById("search").value.toLowerCase();
  root.replaceChildren();
  let count = 0;
  for (const group of [
    "Distributions",
    "Hypothesis testing",
    "Relationships",
    "Sampling & uncertainty",
  ]) {
    const entries = AppletCatalogue.filter(
      (a) =>
        a.group === group &&
        `${a.title} ${a.objective} ${a.group}`.toLowerCase().includes(query),
    );
    if (!entries.length) continue;
    count += entries.length;
    const section = document.createElement("section");
    section.className = "catalogue-section";
    const heading = document.createElement("div");
    heading.className = "section-heading";
    const h2 = document.createElement("h2");
    h2.textContent = group;
    const number = document.createElement("span");
    number.textContent = entries.length + " explorers";
    heading.append(h2, number);
    section.append(heading);
    const grid = document.createElement("div");
    grid.className = "applet-grid";
    for (const entry of entries) {
      const a = document.createElement("a");
      a.className = "applet-card";
      a.href = `html/${entry.id}.html`;
      const h3 = document.createElement("h3");
      h3.textContent = entry.title;
      const p = document.createElement("p");
      p.textContent = entry.objective;
      const next = document.createElement("span");
      next.className = "card-link";
      next.textContent = "Open applet";
      a.append(h3, p, next);
      grid.append(a);
    }
    section.append(grid);
    root.append(section);
  }
  document.getElementById("catalogue-count").textContent =
    `${count} of ${AppletCatalogue.length} explorers`;
}
document.getElementById("search").addEventListener("input", renderCatalogue);
renderCatalogue();
