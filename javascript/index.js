const root = document.getElementById("catalogue");
function renderCatalogue() {
  const query = document.getElementById("search").value.trim().toLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  root.replaceChildren();
  let count = 0;
  for (const group of [
    "Sampling & uncertainty",
    "Relationships",
    "Distributions",
    "Distribution connections",
    "Hypothesis testing",
  ]) {
    const entries = AppletCatalogue.filter(
      (a) =>
        a.group === group &&
        terms.every((term) =>
          `${a.title} ${a.objective} ${a.group} ${LearningContent[a.id]?.keywords || ""}`
            .toLowerCase()
            .includes(term),
        ),
    );
    if (group === "Hypothesis testing") {
      const order = [
        "one-sample-t-test",
        "independent-samples-t-test",
        "one-sample-z-test",
        "chi-squared-explorer",
        "anova-explorer",
        "multiple-comparisons-explorer",
      ];
      entries.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    }
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
    if (group === "Distribution connections") {
      section.id = "distribution-connections";
      const lessonCount = entries.filter((entry) => entry.relationship).length;
      number.textContent =
        (lessonCount ? `${lessonCount} lessons` : "") +
        (entries.some((entry) => entry.overview)
          ? `${lessonCount ? " + " : ""}overview`
          : "");
    }
    heading.append(h2, number);
    section.append(heading);
    const grid = document.createElement("div");
    grid.className = "applet-list";
    let previousSection = "";
    for (const entry of entries) {
      if (entry.relationship && entry.section !== previousSection) {
        const label = document.createElement("h3");
        label.className = "connection-group-label";
        label.textContent =
          entry.section === "Connections"
            ? "Build distributions"
            : "From data to test statistics";
        grid.append(label);
        previousSection = entry.section;
      }
      const a = document.createElement("a");
      a.className = "applet-entry";
      a.href = `html/${entry.id}.html`;
      const h3 = document.createElement(entry.relationship ? "h4" : "h3");
      h3.textContent = entry.title;
      if (entry.overview)
        h3.textContent = "Overview: How distributions connect";
      const p = document.createElement("p");
      p.textContent = entry.objective;
      const text = document.createElement("div");
      text.append(h3);
      if (!entry.relationship) text.append(p);
      if (entry.relationship || entry.overview) {
        a.classList.add("connection-entry");
        a.append(text);
      } else a.append(AppletPreviews.plot(entry.id), text);
      grid.append(a);
    }
    section.append(grid);
    root.append(section);
  }
  if (!count) {
    const empty = document.createElement("p");
    empty.className = "catalogue-empty";
    empty.textContent =
      "No applets match this search. Try a topic such as correlation or clear the search to see every applet.";
    root.append(empty);
  }
  document.getElementById("catalogue-count").textContent =
    `${count} of ${AppletCatalogue.length} pages`;
}
document.getElementById("search").addEventListener("input", renderCatalogue);
renderCatalogue();

const demonstration = document.getElementById("demonstration-plots");
for (const r of [-0.8, 0, 0.8]) {
  const example = document.createElement("div");
  example.append(AppletPreviews.plot("correlation", 180, 112, r));
  const label = document.createElement("p");
  label.textContent = "r = " + String(r).replace("-", "−");
  example.append(label);
  demonstration.append(example);
}
