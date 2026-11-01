// _nuxt/CSNGdBb4 01 — href
// Lines 1-138 of readable/_nuxt/CSNGdBb4.pretty.js (statement-aligned).
import { a as e, i as t, t as n } from "#entry";
import {
  A as r,
  D as i,
  H as a,
  k as o,
  kt as s,
  o as c,
  w as l,
  x as u,
} from "./CYlFAcRp.js";
var pageRootAttrs = { class: `content-page web-demo-page` },
  siteHeaderAttrs = { class: `site-header` },
  headerInnerAttrs = { class: `shell header-inner` },
  siteFooterAttrs = { class: `shell site-footer web-demo-footer` },
  copyrightAttrs = { class: `site-footer__copyright` },
  webDemoPage = r({
    __name: `web-demo`,
    setup(r) {
      let g = c(),
        siteUrlBase = String(g.public.siteUrl).replace(/\/+$/, ``),
        pageUrl = `${siteUrlBase}/web-demo`;
      return (
        e({
          title: `Ultimate Water 2D Web Demo | DiffusionWorks`,
          description: `Play the Ultimate Water 2D interactive Unity WebGL demo in your browser.`,
          ogTitle: `Ultimate Water 2D Web Demo | DiffusionWorks`,
          ogDescription: `Try the interactive Ultimate Water 2D Unity demo directly in your browser.`,
          ogType: `website`,
          ogUrl: pageUrl,
          ogImage: `${siteUrlBase}/asset-store/ultimate-water-2d-social-1200x630.png`,
          twitterCard: `summary_large_image`,
        }),
        t({ link: [{ rel: `canonical`, href: pageUrl }] }),
        (e, t) => {
          let r = n;
          return (
            a(),
            l(`div`, pageRootAttrs, [
              (t[2] ||= u(
                `a`,
                { class: `skip-link`, href: `#main` },
                `Skip to demo`,
                -1,
              )),
              u(`header`, siteHeaderAttrs, [
                u(`div`, headerInnerAttrs, [
                  o(r, { href: `/` }),
                  (t[0] ||= u(
                    `nav`,
                    { "aria-label": `Main navigation` },
                    [
                      u(`a`, { class: `nav-link`, href: `/` }, `Home`),
                      u(
                        `a`,
                        { class: `nav-link`, href: `/docs` },
                        `Documentation`,
                      ),
                      u(
                        `a`,
                        { class: `nav-link`, href: `/support` },
                        `Support`,
                      ),
                    ],
                    -1,
                  )),
                ]),
              ]),
              (t[3] ||= u(
                `main`,
                { id: `main`, class: `shell web-demo-main` },
                [
                  u(`div`, { class: `web-demo-intro` }, [
                    u(`div`, null, [
                      u(`p`, { class: `eyebrow` }, `Playable in your browser`),
                      u(`h1`, null, `Web Demo`),
                    ]),
                    u(
                      `p`,
                      null,
                      `Explore Ultimate Water 2D interactions in a live Unity WebGL build. A desktop browser and hardware acceleration are recommended.`,
                    ),
                  ]),
                  u(
                    `section`,
                    {
                      class: `web-demo-player`,
                      "aria-labelledby": `web-demo-player-title`,
                    },
                    [
                      u(`div`, { class: `web-demo-player__bar` }, [
                        u(`div`, null, [
                          u(`span`, {
                            class: `web-demo-player__status`,
                            "aria-hidden": `true`,
                          }),
                          u(
                            `strong`,
                            { id: `web-demo-player-title` },
                            `Ultimate Water 2D`,
                          ),
                        ]),
                      ]),
                      u(`iframe`, {
                        class: `web-demo-frame`,
                        src: `/unity-demo/index.html`,
                        title: `Ultimate Water 2D interactive Unity WebGL demo`,
                        allow: `fullscreen; autoplay`,
                        allowfullscreen: ``,
                      }),
                    ],
                  ),
                  u(
                    `p`,
                    { class: `web-demo-note` },
                    `The first load downloads approximately 34 MB. Use the fullscreen button below the demo for the best experience.`,
                  ),
                ],
                -1,
              )),
              u(`footer`, siteFooterAttrs, [
                u(
                  `p`,
                  copyrightAttrs,
                  `© ` + s(new Date().getFullYear()) + ` DiffusionWorks`,
                  1,
                ),
                (t[1] ||= i(
                  `<nav class="site-footer__links" aria-label="Footer navigation"><a href="/">Home</a><a href="/docs">Documentation</a><a href="/support">Support</a><a href="/privacy">Privacy</a></nav>`,
                  1,
                )),
              ]),
            ])
          );
        }
      );
    },
  });
