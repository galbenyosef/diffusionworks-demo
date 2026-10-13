import {
  A as e,
  D as t,
  H as n,
  k as r,
  kt as i,
  o as a,
  w as o,
  x as s,
} from "./A3EUxX58.js";
import { a as c, i as l, t as u } from "#entry";
var d = { class: `content-page web-demo-page` },
  f = { class: `site-header` },
  p = { class: `shell header-inner` },
  m = { class: `shell site-footer web-demo-footer` },
  h = { class: `site-footer__copyright` },
  g = e({
    __name: `web-demo`,
    setup(e) {
      let g = a(),
        _ = String(g.public.siteUrl).replace(/\/+$/, ``),
        v = `${_}/web-demo`;
      return (
        c({
          title: `Ultimate Water 2D Web Demo | DiffusionWorks`,
          description: `Play the Ultimate Water 2D interactive Unity WebGL demo in your browser.`,
          ogTitle: `Ultimate Water 2D Web Demo | DiffusionWorks`,
          ogDescription: `Try the interactive Ultimate Water 2D Unity demo directly in your browser.`,
          ogType: `website`,
          ogUrl: v,
          ogImage: `${_}/asset-store/ultimate-water-2d-social-1200x630.png`,
          twitterCard: `summary_large_image`,
        }),
        l({ link: [{ rel: `canonical`, href: v }] }),
        (e, a) => {
          let c = u;
          return (
            n(),
            o(`div`, d, [
              (a[2] ||= s(
                `a`,
                { class: `skip-link`, href: `#main` },
                `Skip to demo`,
                -1,
              )),
              s(`header`, f, [
                s(`div`, p, [
                  r(c, { href: `/` }),
                  (a[0] ||= s(
                    `nav`,
                    { "aria-label": `Main navigation` },
                    [
                      s(`a`, { class: `nav-link`, href: `/` }, `Home`),
                      s(
                        `a`,
                        { class: `nav-link`, href: `/docs` },
                        `Documentation`,
                      ),
                      s(
                        `a`,
                        { class: `nav-link`, href: `/support` },
                        `Support`,
                      ),
                    ],
                    -1,
                  )),
                ]),
              ]),
              (a[3] ||= s(
                `main`,
                { id: `main`, class: `shell web-demo-main` },
                [
                  s(`div`, { class: `web-demo-intro` }, [
                    s(`div`, null, [
                      s(`p`, { class: `eyebrow` }, `Playable in your browser`),
                      s(`h1`, null, `Web Demo`),
                    ]),
                    s(
                      `p`,
                      null,
                      `Explore Ultimate Water 2D interactions in a live Unity WebGL build. A desktop browser and hardware acceleration are recommended.`,
                    ),
                  ]),
                  s(
                    `section`,
                    {
                      class: `web-demo-player`,
                      "aria-labelledby": `web-demo-player-title`,
                    },
                    [
                      s(`div`, { class: `web-demo-player__bar` }, [
                        s(`div`, null, [
                          s(`span`, {
                            class: `web-demo-player__status`,
                            "aria-hidden": `true`,
                          }),
                          s(
                            `strong`,
                            { id: `web-demo-player-title` },
                            `Ultimate Water 2D`,
                          ),
                        ]),
                      ]),
                      s(`iframe`, {
                        class: `web-demo-frame`,
                        src: `/unity-demo/index.html`,
                        title: `Ultimate Water 2D interactive Unity WebGL demo`,
                        allow: `fullscreen; autoplay`,
                        allowfullscreen: ``,
                      }),
                    ],
                  ),
                  s(
                    `p`,
                    { class: `web-demo-note` },
                    `The first load downloads approximately 34 MB. Use the fullscreen button below the demo for the best experience.`,
                  ),
                ],
                -1,
              )),
              s(`footer`, m, [
                s(
                  `p`,
                  h,
                  `© ` + i(new Date().getFullYear()) + ` DiffusionWorks`,
                  1,
                ),
                (a[1] ||= t(
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
export { g as default };
