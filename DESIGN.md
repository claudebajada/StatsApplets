# StatsApplets visual system

StatsApplets is a set of interactive statistics teaching tools. Students change a parameter and inspect its effect on a calculation or plot. The visual identity follows scientific figures and teaching diagrams. The plots are the main content.

## Typography

| Role                       | Typeface                             | Size                 |
| -------------------------- | ------------------------------------ | -------------------- |
| Applet title               | STIX Two Text, 600                   | 36px, 30px on phones |
| Catalogue title            | STIX Two Text, 600                   | 60px, 44px on phones |
| Topic heading              | STIX Two Text, 600                   | 24px                 |
| Body and plot explanations | Source Sans 3, 400                   | 16px                 |
| Controls                   | Source Sans 3, 600                   | 15px, 14px on phones |
| Chart labels               | Source Sans 3                        | 13px                 |
| Results                    | Source Sans 3, 600, tabular numerals | 28px, 24px on phones |

The font files and licences are in `fonts/`. Fonts load locally with `font-display: swap`. Canvas charts repaint after the fonts are ready. Long prose stays within 72 characters per line where practical. Headings use balanced wrapping.

## Colour

| Token      | Value     | Use                                        |
| ---------- | --------- | ------------------------------------------ |
| `--paper`  | `#ffffff` | Page and plot background                   |
| `--panel`  | `#eff3f8` | Parameter area and table headings          |
| `--ink`    | `#172e47` | Titles and primary text                    |
| `--muted`  | `#485c70` | Explanations and supporting labels         |
| `--line`   | `#cdd7e1` | Group boundaries and dividers              |
| `--accent` | `#2456a6` | Links, controls and the first chart series |

Chart series also use rust `#a64922`, teal `#006b69`, purple `#793d91` and olive `#6b5910`. Rust identifies comparison series or shaded test tails. Purple marks observed statistics or critical boundaries. Multi-series plots retain labels, line patterns or point shapes so colour is not the only distinction.

## Layout

The page width is at most 1440px. Desktop applet headers pair the introduction with the equation. Below them, a 256px parameter column sits beside the results and plots. The parameter column becomes 232px at narrower desktop widths, then moves above the plots at 900px. Controls form two columns on phones when labels and input types allow it. Selects and text areas use the full phone width.

Results form one aligned row without separate boxes. Plot captions follow the figure. Calculations, symbol explanations and model details remain available through native disclosure controls. The correlation walkthrough keeps its four stages and vector diagram.

Regression and ANOVA show the controls for the selected data source. Simulated mode hides the manual text area. Manual mode hides simulation parameters and the new-sample action. Switching modes preserves both sets of values and their URL state.

The catalogue groups open entries by topic. Each entry has a small diagram computed using the existing statistical functions. The opening shows three constructed samples with specified sample correlations. Diagrams are labelled as examples, and decorative previews are hidden from assistive technology.

## Components and spacing

The spacing scale is 4, 8, 12, 16, 24, 32 and 48px. Related controls use the smaller steps. Separate topics and task regions use the larger ones. Buttons and inputs have 3px corners. There are no gradients, shadows, floating cards or decorative entrance animations.

Every interactive element keeps a visible keyboard focus outline. Buttons and selects have a minimum height of 44px. Coarse-pointer sliders and disclosure controls also have 44px targets. Touch and keyboard use the native controls. State lives in the existing shareable URLs.

## Verification

Compare the catalogue, a mean test, a single-distribution applet, the three-stage binomial applet and the correlation walkthrough at desktop and mobile sizes. Check intermediate widths, 320px screens, open disclosures, long labels, manual data, errors, keyboard input and touch. Verify that the statistical data and equations remain unchanged when editing appearance.

The design used the written Anthropic Frontend Design and Impeccable guidance, including their typography, layout, responsive and critique references. The Impeccable launcher was unavailable, so its scripted detector and review commands were not run.
