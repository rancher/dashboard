import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../blueprint.utils';

// GET /v1/fleet.cattle.io.contents - return empty contents data
const fleetContentsGetResponseEmpty = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/fleet.cattle.io.contents' },
  createTypes:  { 'fleet.cattle.io.content': 'https://yonasb29head.qa.rancher.space/v1/fleet.cattle.io.contents' },
  actions:      {},
  resourceType: 'fleet.cattle.io.content',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        0,
  data:         []
};

// GET /v1/fleet.cattle.io.contents - small set of contents data
const fleetContentsResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/fleet.cattle.io.contents' },
  createTypes:  { 'fleet.cattle.io.content': 'https://yonasb29head.qa.rancher.space/v1/fleet.cattle.io.contents' },
  actions:      {},
  resourceType: 'fleet.cattle.io.content',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        2,
  data:         [
    {
      id:    's-65075fe21d0e5087693027a2fdbb5ed559295ed1ffeb5957f98d77decb4a5',
      type:  'fleet.cattle.io.content',
      links: {
        remove: 'https://yonasb29head.qa.rancher.space/v1/fleet.cattle.io.contents/s-65075fe21d0e5087693027a2fdbb5ed559295ed1ffeb5957f98d77decb4a5',
        self:   'https://yonasb29head.qa.rancher.space/v1/fleet.cattle.io.contents/s-65075fe21d0e5087693027a2fdbb5ed559295ed1ffeb5957f98d77decb4a5',
        update: 'https://yonasb29head.qa.rancher.space/v1/fleet.cattle.io.contents/s-65075fe21d0e5087693027a2fdbb5ed559295ed1ffeb5957f98d77decb4a5',
        view:   'https://yonasb29head.qa.rancher.space/apis/fleet.cattle.io/v1alpha1/contents/s-65075fe21d0e5087693027a2fdbb5ed559295ed1ffeb5957f98d77decb4a5'
      },
      apiVersion: 'fleet.cattle.io/v1alpha1',
      content:    'H4sIAAAAAAAA/9xX0c/aNhB/319h5aXStKTwMG3yG0O0Q2MUAe3LmCrjXMDDOWf2mZZ++v73yQkJCaTdWD9tVf2AyNl3v7uff3YuD5EFZ7yV4CL+20OEIoeIR2IHSMlJ5Dr6LpIGCZCCuVBvwDplkDO7FTIRnvbGqg+ClMHk8KNLlHl+HG7woDDlbKy9I7BLo2GDOZBIBQm+QcYCDmdSEGmIMw1AsTs5gvz8UCYQ29LReg2ObzBmolAvrfGFK2PE7Nm3z8KfpoSu+Qh22zHFDA0uz4tfL2d/t36DcRxv8DOq/klhqnD3r4uPt3WA8LSErPSvafhEOmFZzx7cR7zz2z9AUsV9FW0F9qgkjKQ0HukSsOVcG10hZD9UL7MX/q4xerh7GjjhyeQBo4u4NgdAzjKhHdyRUwqZ8PrJyn+Kul0BsvSWlQimC87mBkshONAgydhyPmiquAlPpwIaAU0XvXmLonAt7a9IEGRer+BJNq4p4CrbXJDcz8QWtDtb+itwFZfzPmyCvNCCoA7ZTjYMaaE8UWuVgyORF5yh17qe1l30fnzGmgrKJVmmUNGJs4fHBsYgCYVgL7FiJk2eC0xb0eMqdCtyGIDHzpqK5Pno18lqMRpPLlOMHYX28MKanLetjGUKdFrfLDcTC0F73nCTNPt1Czp6OZmv367GrxYtWJWLHXBmBco92OctdvhxkAwHySC2Mhn+cOWx8FovjFbyxNk0mxtaWHCdwnvVVI3L26DFcpCC9FbRaRzeZu+pU67Q2rxbWHVUGnYwcVLocuubS+CyVIpCbJVWpMBdUZZaU1yZYjaazdqmogZJe2JbEOkr1KelMfRCaahOAWdkPdyvjbg+9Y4EefdFimb882T8y3T+djpfT5ZvRrMbbM6G3+cD938oKv4IfV+3vsL9NP6cKylmFnYqEPdFKe4/1M1t/V+3ZNCksOq+n8M4+C1YBIKyPTaOM63Qv68XfLx463Hkzg3ucDAYXM3MDYZsujmc5147sF0n12ncehuBMMhosCXBbc1DloGk0DOt5B5Sr1t4BzjxsvREauPTwpqjSsEm3bI9hgOlhFYfIL04myKgGcvZ5E8v9GXifOltorK46I5Uqv6povqfAzVb4otUEKzICoLduUHpafcQ6J2xB4W72++eeTVXHZdPtchxKe7we1cPCDsLrv5Aq86RwltbYdJGjY0ppLQ+Fc0n4rRyrB4m5//R4++P3/wVAAD//4OA3yESDwAA',
      kind:       'Content',
      metadata:   {
        creationTimestamp: '2024-07-05T19:45:20Z',
        fields:            [
          's-65075fe21d0e5087693027a2fdbb5ed559295ed1ffeb5957f98d77decb4a5',
          '27h'
        ],
        generation:      1,
        name:            's-65075fe21d0e5087693027a2fdbb5ed559295ed1ffeb5957f98d77decb4a5',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '58394962-322e-42f6-ae08-98b1faeb63f9'
      },
      sha256sum: '65075fe21d0e5087693027a2fdbb5ed559295ed1ffeb5957f98d77decb4a5b35'
    },
    {
      id:    's-807cc7bcb0de2dae39c913c375f676238d021519258d34913ccc842519c63',
      type:  'fleet.cattle.io.content',
      links: {
        remove: 'https://yonasb29head.qa.rancher.space/v1/fleet.cattle.io.contents/s-807cc7bcb0de2dae39c913c375f676238d021519258d34913ccc842519c63',
        self:   'https://yonasb29head.qa.rancher.space/v1/fleet.cattle.io.contents/s-807cc7bcb0de2dae39c913c375f676238d021519258d34913ccc842519c63',
        update: 'https://yonasb29head.qa.rancher.space/v1/fleet.cattle.io.contents/s-807cc7bcb0de2dae39c913c375f676238d021519258d34913ccc842519c63',
        view:   'https://yonasb29head.qa.rancher.space/apis/fleet.cattle.io/v1alpha1/contents/s-807cc7bcb0de2dae39c913c375f676238d021519258d34913ccc842519c63'
      },
      apiVersion: 'fleet.cattle.io/v1alpha1',
      content:    'H4sIAAAAAAAA/9xXTY/bNhO+v7+C8CXAi1KxD0UL3VzXSY1uHcN2cqmLgKZGMmtqqJJD7zqL/e8FJVm2LGWbZBdtEB4W1nx/PMMd3g8sOOOtBDeIf78foMhhEA9EBkjRUeR68N1AGiRACuRCvQPrlMGY2a2QkfC0M1Z9EKQMRvsfXaTMy8Nog3uFScwm2jsCuzQaNpgDiUSQiDfIWPATMymINPBUAxDXRgrN3dER5DWpDIPbUt16DS7eIGeiUK+t8YUrLXH24v8vwo8mkTb5AHbbInGGBpe18NvlzT/Jb5BzvsEn5P6TwkRh9sQS8O3JTPhaQlpaORXjkaCCWE8/vqQJzm//BElVHyqbK7AHJWEspfFIZ7MXyieiK4R8zGFvrc8VvfbUU83ndCo8mTx4avtdmz1gzFKhHXxGZAmkwutnLsXz1cAVIEsbsoLIbBGzucESJg40SDK25AfEFR0ndCyggdds0Ru9KAp3MR8rEgSp1yt4xlY2aVzFnAuSuxuxBe1qSn8erqrrvC8CgrzQguBk8jLkcKSFcurWKgdHIi9ihl7rE1u3vff7Z6zJoBRJU4WKjhdaaBIYd8mMFRZSsBaSn71VmK3kDhKvFWazDE1Dnt6B9CHKli6vtQEltBhN7aZ3hQUXGuk6Apzt4VinElXNCVfhRVKXxxRgRegMm2GXexDaQ9dFcLIZkPWwGbR5t6CyHcVs1LTBIAmFYM9WOJMmzwUmF3Z5Fe9VkICHlkwFxfn4t+lqMZ5ML12Xkb6yJr8KNlWgk9Pt3GEsBO3iBjtRg+qu0/Hr6Xz9fjV5s+i6fXQGTpIqFxnEzAqUO7AvL5AWH4bRaBgNuZXR6IcrjYXXemG0kseYzdK5oYUF1ypS73xW5/w/mN0/nMkOpLeKjpOwSdxRqzRCa3O7sOqgNGQwdVLocoyaK/YsKkUhtkorUh2IJNYUVyTOxjc37QmpnSQ9ti2I5A3q49IYeqU0VNWMWYm5z8YRP92jjgR591UCbPLLdPLrbP5+Nl9Pl+/GNz0oG32fD91/gSj+kfJ92/gKl/rkKdcXZxYyFQr3VSHuX8RNN/9vGzJhHVi1d51w9n4LFoGgfJQYFzOt0N+dBD6evPU4dvWDYjQcDq84c4MhmnYMNe+tA9tWcq21uHepCoeMDitBa7fgDNIUJIUttF5lLvyV+0ZIPZLa+KSw5qASsFE7bY9hoJTQ6gMkZ+XzAjL9ywt9ZtSX3vWe8QmhnJce4z7dUdMSXySCYEVWEGTHCqc9CzQC3Rq7V5h1X5vzileNy2MPEF6CO/z9gq0asrAE1o/japoUdmmFSRpMNqQQ2PpYNM/zWaVYfUzr34OHPx7+93cAAAD//0cdD3mUEAAA',
      kind:       'Content',
      metadata:   {
        creationTimestamp: '2024-06-27T20:37:41Z',
        fields:            [
          's-807cc7bcb0de2dae39c913c375f676238d021519258d34913ccc842519c63',
          '9d'
        ],
        generation:      1,
        name:            's-807cc7bcb0de2dae39c913c375f676238d021519258d34913ccc842519c63',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '7aa06818-19c7-4b90-b386-255b26496aad'
      },
      sha256sum: '807cc7bcb0de2dae39c913c375f676238d021519258d34913ccc842519c639b9'
    }
  ]
};

function reply(statusCode: number, body: any) {
  return (req) => {
    req.reply({
      statusCode,
      body
    });
  };
}

export function fleetContentsNoData(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/fleet.cattle.io.contents?*', reply(200, fleetContentsGetResponseEmpty)).as('fleetContentsNoData');
}

export function generateFleetContentsDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/fleet.cattle.io.contents?*', reply(200, fleetContentsResponseSmallSet)).as('fleetContentsDataSmall');
}
