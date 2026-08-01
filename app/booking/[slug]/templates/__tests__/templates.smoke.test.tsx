// @vitest-environment jsdom
// Baseline safety net for the Phase 6 token/polish migration: every template must render
// without crashing and show its core content, across a few representative configs. Not a
// pixel/snapshot test — those would fight the intentional visual changes this migration makes.
import type { ComponentType } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { TemplateProps } from "../../_shared";
import { ClassicTemplate } from "../classic";
import { SoftTemplate } from "../soft";
import { HeroTemplate } from "../hero";
import { NeonTemplate } from "../neon";
import { MagazineTemplate } from "../magazine";
import { SplitTemplate } from "../split";
import { CorporateTemplate } from "../corporate";
import { TattooTemplate } from "../tattoo";
import { BarbershopTemplate } from "../barbershop";
import { BeautyTemplate } from "../beauty";
import { OrganicTemplate } from "../organic";
import { ClinicTemplate } from "../clinic";
import { FitnessTemplate } from "../fitness";
import { RestaurantTemplate } from "../restaurant";
import { PortfolioTemplate } from "../portfolio";
import { buildTestTemplateProps, DEFAULT_CONFIG, DARK_CONFIG, FULL_CONFIG } from "./fixtures";

afterEach(() => cleanup());

const TEMPLATES: { name: string; Component: ComponentType<TemplateProps> }[] = [
  { name: "classic", Component: ClassicTemplate },
  { name: "soft", Component: SoftTemplate },
  { name: "hero", Component: HeroTemplate },
  { name: "neon", Component: NeonTemplate },
  { name: "magazine", Component: MagazineTemplate },
  { name: "split", Component: SplitTemplate },
  { name: "corporate", Component: CorporateTemplate },
  { name: "tattoo", Component: TattooTemplate },
  { name: "barbershop", Component: BarbershopTemplate },
  { name: "beauty", Component: BeautyTemplate },
  { name: "organic", Component: OrganicTemplate },
  { name: "clinic", Component: ClinicTemplate },
  { name: "fitness", Component: FitnessTemplate },
  { name: "restaurant", Component: RestaurantTemplate },
  { name: "portfolio", Component: PortfolioTemplate },
];

const CONFIGS: [string, typeof DEFAULT_CONFIG][] = [
  ["default", DEFAULT_CONFIG],
  ["dark/grid", DARK_CONFIG],
  ["full", FULL_CONFIG],
];

describe.each(TEMPLATES)("$name template", ({ Component }) => {
  it.each(CONFIGS)("renders without crashing with %s config", (_label, cfg) => {
    const props = buildTestTemplateProps({
      cfg,
      linktreeStyle: cfg === DARK_CONFIG ? "dark" : "gradient",
    });
    const { container } = render(<Component {...props} />);

    expect(container.textContent).toContain("Test Salon");
    expect(
      screen.getAllByRole("link", { name: /Instagram|WhatsApp/i }).length
    ).toBeGreaterThan(0);
  });
});
