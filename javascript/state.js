(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AppletState = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  function validate(raw, schema) {
    if (raw === null || raw === undefined) return schema.default;
    if (schema.type === "checkbox")
      return raw === true || raw === "true"
        ? true
        : raw === false || raw === "false"
          ? false
          : schema.default;
    if (schema.type === "select")
      return schema.options.includes(String(raw))
        ? String(raw)
        : schema.default;
    if (schema.type === "text")
      return String(raw).length <= 12000 ? String(raw) : schema.default;
    const value = Number(raw);
    if (
      String(raw).trim() === "" ||
      !Number.isFinite(value) ||
      value < schema.min ||
      value > schema.max
    )
      return schema.default;
    const snapped =
      schema.min + Math.round((value - schema.min) / schema.step) * schema.step;
    return Number(
      Math.max(schema.min, Math.min(schema.max, snapped)).toFixed(10),
    );
  }
  function decode(query, schema) {
    const params = new URLSearchParams(query),
      result = {};
    for (const [key, spec] of Object.entries(schema))
      result[key] = validate(params.get(key), spec);
    return result;
  }
  function encode(state, schema) {
    const params = new URLSearchParams();
    for (const [key, spec] of Object.entries(schema))
      params.set(key, String(validate(state[key], spec)));
    return params;
  }
  return { validate, decode, encode };
});
