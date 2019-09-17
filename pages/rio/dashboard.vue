<script>
import Random from '@/components/Random';

export default { components: { Random } };
</script>
<template>
  <div>
    <header>
      <h1>Dashboard</h1>
    </header>
    <div>
      <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1166 507.44398">
        <defs>
          <style>
            .cls-1{fill:#212127;}.cls-12,.cls-2,.cls-23,.cls-26,.cls-3,.cls-9{isolation:isolate;}.cls-12,.cls-23,.cls-3{font-size:10px;font-family:FiraSans-Bold, Fira Sans;font-weight:700;}.cls-12,.cls-23,.cls-26,.cls-3,.cls-9{fill:#b6b6c2;}.cls-13,.cls-3{letter-spacing:0.05em;}.cls-4{letter-spacing:0.03496em;}.cls-5{letter-spacing:0.05005em;}.cls-23,.cls-6{letter-spacing:0.03999em;}.cls-7{letter-spacing:0.04995em;}.cls-8{letter-spacing:0.01401em;}.cls-9{font-size:40px;font-family:FiraSans-Light, Fira Sans;font-weight:300;}.cls-10{letter-spacing:0.04004em;}.cls-11{letter-spacing:-0.01001em;}.cls-14{letter-spacing:0.03003em;}.cls-15,.cls-16,.cls-20,.cls-22,.cls-24,.cls-31{fill:none;}.cls-15{stroke:#6c6c76;}.cls-15,.cls-16{stroke-linecap:round;stroke-linejoin:round;stroke-width:5px;}.cls-16{stroke:#96bd7f;}.cls-17{letter-spacing:0.02202em;}.cls-18{letter-spacing:0.04502em;}.cls-19{letter-spacing:-0.11998em;}.cls-20,.cls-31{stroke:#27292e;}.cls-20,.cls-21,.cls-22,.cls-24,.cls-25{stroke-miterlimit:10;}.cls-21,.cls-25{fill:#1b1c21;}.cls-21,.cls-22{stroke:#924be4;}.cls-21,.cls-22,.cls-25{stroke-width:0.75px;}.cls-24,.cls-25{stroke:#3d98d3;}.cls-26{font-size:14px;font-family:FiraSans-Regular, Fira Sans;}.cls-27{letter-spacing:-0.00997em;}.cls-28{letter-spacing:-0.02497em;}.cls-29{letter-spacing:-0.02999em;}.cls-30{letter-spacing:0.00003em;}
          </style>
        </defs>
        <title>dashboard
        </title>
        <rect id="Rectangle_1618" data-name="Rectangle 1618" class="cls-1" width="1166" height="245" />
        <g id="Group_1273" data-name="Group 1273">
          <g id="Services_Monitored" data-name="Services Monitored" class="cls-2">
            <text class="cls-3" transform="translate(88.28 92)">
              SERVICES MONITORED
            </text>
          </g>
          <g id="_3" data-name=" 3" class="cls-2">
            <Random tagName="text" class="cls-9" transform="translate(131.78 70)" :min="1" :max="10" />
          </g>
        </g>
        <g id="Group_1274" data-name="Group 1274">
          <g id="Instances" class="cls-2">
            <text class="cls-3" transform="translate(128.375 215)">
              PODS
            </text>
          </g>
          <g id="_5" data-name=" 5" class="cls-2">
            <Random tagName="text" class="cls-9" transform="translate(131.760001 193)" :min="1" :max="10" />
          </g>
        </g>
        <g id="Group_1272" data-name="Group 1272">
          <g id="Global_Success_rate" data-name="Global Success rate" class="cls-2">
            <text class="cls-12" transform="translate(347.75499 202)">
              GLOBAL SUCCESS RATE
            </text>
          </g>
          <g class="cls-2">
            <text class="cls-9" transform="translate(369.15996 179)">75%
            </text>
          </g>
          <g id="Group_1258" data-name="Group 1258">
            <circle
              id="Ellipse_573"
              data-name="Ellipse 573"
              class="cls-15"
              cx="394.00003"
              cy="74"
              r="50"
            />
            <path id="Path_1413" data-name="Path 1413" class="cls-16" d="M393.99893,124a50,50,0,1,1,50-50h0" />
          </g>
        </g>
        <g id="Group_1275" data-name="Group 1275">
          <g id="Global_Request_volume" data-name="Global Request volume" class="cls-2">
            <text class="cls-3" transform="translate(551.32 201)">
              GLOBAL REQUEST VOLUME
            </text>
          </g>
          <g id="_1.15K_rps" data-name=" 1.15K rps" class="cls-2">
            <Random
              tagName="text"
              class="cls-9"
              transform="translate(542.61998 179)"
              :min="1"
              :max="9"
              :decimals="1"
              suffix="k rps"
            />
          </g>
          <g id="Group_1265" data-name="Group 1265">
            <g id="Group_1264" data-name="Group 1264">
              <line
                id="Line_212"
                data-name="Line 212"
                class="cls-20"
                x1="534.25"
                y1="101.946"
                x2="699.74899"
                y2="101.946"
              />
              <line
                id="Line_213"
                data-name="Line 213"
                class="cls-20"
                x1="534.25"
                y1="88.079"
                x2="699.74899"
                y2="88.079"
              />
              <line
                id="Line_214"
                data-name="Line 214"
                class="cls-20"
                x1="534.25"
                y1="74.211"
                x2="699.74899"
                y2="74.211"
              />
              <line
                id="Line_215"
                data-name="Line 215"
                class="cls-20"
                x1="534.25"
                y1="60.344"
                x2="699.74899"
                y2="60.344"
              />
              <line
                id="Line_216"
                data-name="Line 216"
                class="cls-20"
                x1="534.25"
                y1="46.476"
                x2="699.74899"
                y2="46.476"
              />
              <line
                id="Line_217"
                data-name="Line 217"
                class="cls-20"
                x1="699.74899"
                y1="115.813"
                x2="534.25"
                y2="115.813"
              />
              <line
                id="Line_218"
                data-name="Line 218"
                class="cls-20"
                x1="534.25"
                y1="32.609"
                x2="699.74899"
                y2="32.609"
              />
            </g>
            <circle
              id="Ellipse_581"
              data-name="Ellipse 581"
              class="cls-21"
              cx="534.705"
              cy="102.17301"
              r="1.705"
            />
            <circle
              id="Ellipse_582"
              data-name="Ellipse 582"
              class="cls-21"
              cx="561.98503"
              cy="73.984"
              r="1.705"
            />
            <circle
              id="Ellipse_583"
              data-name="Ellipse 583"
              class="cls-21"
              cx="589.265"
              cy="87.624"
              r="1.705"
            />
            <circle
              id="Ellipse_584"
              data-name="Ellipse 584"
              class="cls-21"
              cx="617.455"
              cy="73.984"
              r="1.705"
            />
            <circle
              id="Ellipse_585"
              data-name="Ellipse 585"
              class="cls-21"
              cx="644.73503"
              cy="60.344"
              r="1.705"
            />
            <circle
              id="Ellipse_586"
              data-name="Ellipse 586"
              class="cls-21"
              cx="672.015"
              cy="88.533"
              r="1.705"
            />
            <circle
              id="Ellipse_587"
              data-name="Ellipse 587"
              class="cls-21"
              cx="699.29503"
              cy="46.704"
              r="1.705"
            />
            <line
              id="Line_219"
              data-name="Line 219"
              class="cls-22"
              x1="536.06897"
              y1="100.809"
              x2="560.62097"
              y2="75.348"
            />
            <line
              id="Line_220"
              data-name="Line 220"
              class="cls-22"
              x1="563.349"
              y1="74.438"
              x2="587.901"
              y2="87.169"
            />
            <line
              id="Line_221"
              data-name="Line 221"
              class="cls-22"
              x1="590.62903"
              y1="87.169"
              x2="616.09003"
              y2="74.438"
            />
            <line
              id="Line_222"
              data-name="Line 222"
              class="cls-22"
              x1="618.81897"
              y1="73.529"
              x2="643.37097"
              y2="60.798"
            />
            <line
              id="Line_223"
              data-name="Line 223"
              class="cls-22"
              x1="646.099"
              y1="61.708"
              x2="670.651"
              y2="88.079"
            />
            <line
              id="Line_224"
              data-name="Line 224"
              class="cls-22"
              x1="673.37903"
              y1="87.169"
              x2="698.84003"
              y2="48.068"
            />
          </g>
        </g>
        <g id="Group_1276" data-name="Group 1276">
          <g id="_4xx_Errors" data-name=" 4xx Errors" class="cls-2">
            <text class="cls-3" transform="translate(800.78002 201)">
              4xx ERRORS
            </text>
          </g>
          <g id="_0_rps" data-name=" 0 rps" class="cls-2">
            <Random
              tagName="text"
              class="cls-9"
              transform="translate(784.56005 179)"
              :min="0"
              :max="1"
              :decimals="1"
              suffix="k rps"
            />
          </g>
          <g id="Group_1266" data-name="Group 1266">
            <g id="Group_1264-2" data-name="Group 1264-2">
              <line
                id="Line_212-2"
                data-name="Line 212-2"
                class="cls-20"
                x1="748.25"
                y1="101.946"
                x2="913.74899"
                y2="101.946"
              />
              <line
                id="Line_213-2"
                data-name="Line 213-2"
                class="cls-20"
                x1="748.25"
                y1="88.079"
                x2="913.74899"
                y2="88.079"
              />
              <line
                id="Line_214-2"
                data-name="Line 214-2"
                class="cls-20"
                x1="748.25"
                y1="74.211"
                x2="913.74899"
                y2="74.211"
              />
              <line
                id="Line_215-2"
                data-name="Line 215-2"
                class="cls-20"
                x1="748.25"
                y1="60.344"
                x2="913.74899"
                y2="60.344"
              />
              <line
                id="Line_216-2"
                data-name="Line 216-2"
                class="cls-20"
                x1="748.25"
                y1="46.476"
                x2="913.74899"
                y2="46.476"
              />
              <line
                id="Line_217-2"
                data-name="Line 217-2"
                class="cls-20"
                x1="913.74899"
                y1="115.813"
                x2="748.25"
                y2="115.813"
              />
              <line
                id="Line_218-2"
                data-name="Line 218-2"
                class="cls-20"
                x1="748.25"
                y1="32.609"
                x2="913.74899"
                y2="32.609"
              />
            </g>
            <circle
              id="Ellipse_581-2"
              data-name="Ellipse 581-2"
              class="cls-21"
              cx="748.705"
              cy="102.17301"
              r="1.705"
            />
            <circle
              id="Ellipse_582-2"
              data-name="Ellipse 582-2"
              class="cls-21"
              cx="775.98503"
              cy="73.984"
              r="1.705"
            />
            <circle
              id="Ellipse_583-2"
              data-name="Ellipse 583-2"
              class="cls-21"
              cx="803.265"
              cy="87.624"
              r="1.705"
            />
            <circle
              id="Ellipse_584-2"
              data-name="Ellipse 584-2"
              class="cls-21"
              cx="831.455"
              cy="73.984"
              r="1.705"
            />
            <circle
              id="Ellipse_585-2"
              data-name="Ellipse 585-2"
              class="cls-21"
              cx="858.73503"
              cy="60.344"
              r="1.705"
            />
            <circle
              id="Ellipse_586-2"
              data-name="Ellipse 586-2"
              class="cls-21"
              cx="886.015"
              cy="88.533"
              r="1.705"
            />
            <circle
              id="Ellipse_587-2"
              data-name="Ellipse 587-2"
              class="cls-21"
              cx="913.29503"
              cy="46.704"
              r="1.705"
            />
            <line
              id="Line_219-2"
              data-name="Line 219-2"
              class="cls-22"
              x1="750.06897"
              y1="100.809"
              x2="774.62097"
              y2="75.348"
            />
            <line
              id="Line_220-2"
              data-name="Line 220-2"
              class="cls-22"
              x1="777.349"
              y1="74.438"
              x2="801.901"
              y2="87.169"
            />
            <line
              id="Line_221-2"
              data-name="Line 221-2"
              class="cls-22"
              x1="804.62903"
              y1="87.169"
              x2="830.09003"
              y2="74.438"
            />
            <line
              id="Line_222-2"
              data-name="Line 222-2"
              class="cls-22"
              x1="832.81897"
              y1="73.529"
              x2="857.37097"
              y2="60.798"
            />
            <line
              id="Line_223-2"
              data-name="Line 223-2"
              class="cls-22"
              x1="860.099"
              y1="61.708"
              x2="884.651"
              y2="88.079"
            />
            <line
              id="Line_224-2"
              data-name="Line 224-2"
              class="cls-22"
              x1="887.37903"
              y1="87.169"
              x2="912.84003"
              y2="48.068"
            />
          </g>
        </g>
        <g id="Group_1277" data-name="Group 1277">
          <g id="_5xx_Errors" data-name=" 5xx Errors" class="cls-2">
            <text class="cls-23" transform="translate(1016.97503 201)">
              5xx ERRORS
            </text>
          </g>
          <g id="_0_rps-2" data-name=" 0 rps-2" class="cls-2">
            <Random
              tagName="text"
              class="cls-9"
              transform="translate(1002.56011 179)"
              :min="0"
              :max="1"
              :decimals="1"
              suffix="k rps"
            />
          </g>
          <g id="Group_1267" data-name="Group 1267">
            <g id="Group_1264-3" data-name="Group 1264-3">
              <line
                id="Line_212-3"
                data-name="Line 212-3"
                class="cls-20"
                x1="963.25"
                y1="101.946"
                x2="1128.74899"
                y2="101.946"
              />
              <line
                id="Line_213-3"
                data-name="Line 213-3"
                class="cls-20"
                x1="963.25"
                y1="88.079"
                x2="1128.74899"
                y2="88.079"
              />
              <line
                id="Line_214-3"
                data-name="Line 214-3"
                class="cls-20"
                x1="963.25"
                y1="74.211"
                x2="1128.74899"
                y2="74.211"
              />
              <line
                id="Line_215-3"
                data-name="Line 215-3"
                class="cls-20"
                x1="963.25"
                y1="60.344"
                x2="1128.74899"
                y2="60.344"
              />
              <line
                id="Line_216-3"
                data-name="Line 216-3"
                class="cls-20"
                x1="963.25"
                y1="46.476"
                x2="1128.74899"
                y2="46.476"
              />
              <line
                id="Line_217-3"
                data-name="Line 217-3"
                class="cls-20"
                x1="1128.74899"
                y1="115.813"
                x2="963.25"
                y2="115.813"
              />
              <line
                id="Line_218-3"
                data-name="Line 218-3"
                class="cls-20"
                x1="963.25"
                y1="32.609"
                x2="1128.74899"
                y2="32.609"
              />
            </g>
            <circle
              id="Ellipse_581-3"
              data-name="Ellipse 581-3"
              class="cls-21"
              cx="963.705"
              cy="102.17301"
              r="1.705"
            />
            <circle
              id="Ellipse_582-3"
              data-name="Ellipse 582-3"
              class="cls-21"
              cx="990.98503"
              cy="73.984"
              r="1.705"
            />
            <circle
              id="Ellipse_583-3"
              data-name="Ellipse 583-3"
              class="cls-21"
              cx="1018.265"
              cy="87.624"
              r="1.705"
            />
            <circle
              id="Ellipse_584-3"
              data-name="Ellipse 584-3"
              class="cls-21"
              cx="1046.455"
              cy="73.984"
              r="1.705"
            />
            <circle
              id="Ellipse_585-3"
              data-name="Ellipse 585-3"
              class="cls-21"
              cx="1073.73503"
              cy="60.344"
              r="1.705"
            />
            <circle
              id="Ellipse_586-3"
              data-name="Ellipse 586-3"
              class="cls-21"
              cx="1101.015"
              cy="88.533"
              r="1.705"
            />
            <circle
              id="Ellipse_587-3"
              data-name="Ellipse 587-3"
              class="cls-21"
              cx="1128.29503"
              cy="46.704"
              r="1.705"
            />
            <line
              id="Line_219-3"
              data-name="Line 219-3"
              class="cls-22"
              x1="965.06897"
              y1="100.809"
              x2="989.62097"
              y2="75.348"
            />
            <line
              id="Line_220-3"
              data-name="Line 220-3"
              class="cls-22"
              x1="992.349"
              y1="74.438"
              x2="1016.901"
              y2="87.169"
            />
            <line
              id="Line_221-3"
              data-name="Line 221-3"
              class="cls-22"
              x1="1019.62903"
              y1="87.169"
              x2="1045.09003"
              y2="74.438"
            />
            <line
              id="Line_222-3"
              data-name="Line 222-3"
              class="cls-22"
              x1="1047.81897"
              y1="73.529"
              x2="1072.37097"
              y2="60.798"
            />
            <line
              id="Line_223-3"
              data-name="Line 223-3"
              class="cls-22"
              x1="1075.099"
              y1="61.708"
              x2="1099.651"
              y2="88.079"
            />
            <line
              id="Line_224-3"
              data-name="Line 224-3"
              class="cls-22"
              x1="1102.37903"
              y1="87.169"
              x2="1127.84003"
              y2="48.068"
            />
          </g>
        </g>
        <g id="Group_1269" data-name="Group 1269">
          <g id="Group_1268" data-name="Group 1268">
            <line
              id="Line_225"
              data-name="Line 225"
              class="cls-20"
              x1="387.40198"
              y1="507.44398"
              x2="43.59698"
              y2="507.44398"
            />
            <line
              id="Line_226"
              data-name="Line 226"
              class="cls-20"
              x1="43.59698"
              y1="334.59698"
              x2="387.40198"
              y2="334.59698"
            />
            <line
              id="Line_227"
              data-name="Line 227"
              class="cls-20"
              x1="43.59698"
              y1="478.63599"
              x2="387.40198"
              y2="478.63599"
            />
            <line
              id="Line_228"
              data-name="Line 228"
              class="cls-20"
              x1="43.59698"
              y1="449.82799"
              x2="387.40198"
              y2="449.82799"
            />
            <line
              id="Line_229"
              data-name="Line 229"
              class="cls-20"
              x1="43.59698"
              y1="421.02099"
              x2="387.40198"
              y2="421.02099"
            />
            <line
              id="Line_230"
              data-name="Line 230"
              class="cls-20"
              x1="43.59698"
              y1="392.21299"
              x2="387.40198"
              y2="392.21299"
            />
            <line
              id="Line_231"
              data-name="Line 231"
              class="cls-20"
              x1="43.59698"
              y1="363.40499"
              x2="387.40198"
              y2="363.40499"
            />
          </g>
          <circle
            id="Ellipse_588"
            data-name="Ellipse 588"
            class="cls-21"
            cx="44.542"
            cy="482.887"
            r="3.542"
          />
          <circle
            id="Ellipse_589"
            data-name="Ellipse 589"
            class="cls-21"
            cx="101.21302"
            cy="424.327"
            r="3.542"
          />
          <circle
            id="Ellipse_590"
            data-name="Ellipse 590"
            class="cls-21"
            cx="157.88398"
            cy="452.662"
            r="3.542"
          />
          <circle
            id="Ellipse_591"
            data-name="Ellipse 591"
            class="cls-21"
            cx="216.44502"
            cy="424.327"
            r="3.542"
          />
          <circle
            id="Ellipse_592"
            data-name="Ellipse 592"
            class="cls-21"
            cx="273.11597"
            cy="395.99101"
            r="3.542"
          />
          <circle
            id="Ellipse_593"
            data-name="Ellipse 593"
            class="cls-21"
            cx="329.787"
            cy="454.551"
            r="3.542"
          />
          <circle
            id="Ellipse_594"
            data-name="Ellipse 594"
            class="cls-21"
            cx="386.45802"
            cy="367.65601"
            r="3.542"
          />
          <line
            id="Line_232"
            data-name="Line 232"
            class="cls-22"
            x1="47.37598"
            y1="480.05301"
            x2="98.37998"
            y2="427.16"
          />
          <line
            id="Line_233"
            data-name="Line 233"
            class="cls-22"
            x1="104.047"
            y1="425.271"
            x2="155.051"
            y2="451.718"
          />
          <line
            id="Line_234"
            data-name="Line 234"
            class="cls-22"
            x1="160.71802"
            y1="451.718"
            x2="213.61102"
            y2="425.271"
          />
          <line
            id="Line_235"
            data-name="Line 235"
            class="cls-22"
            x1="219.27802"
            y1="423.38301"
            x2="270.28202"
            y2="396.936"
          />
          <line
            id="Line_236"
            data-name="Line 236"
            class="cls-22"
            x1="275.94897"
            y1="398.82501"
            x2="326.95298"
            y2="453.60701"
          />
          <line
            id="Line_237"
            data-name="Line 237"
            class="cls-22"
            x1="332.62"
            y1="451.71801"
            x2="385.513"
            y2="370.48901"
          />
          <path id="Path_1414" data-name="Path 1414" class="cls-24" d="M43.597,425.271l56.671-60.449,56.671,28.336,58.56-28.336h56.671l56.671,28.336L385.513,336.486" />
          <circle
            id="Ellipse_595"
            data-name="Ellipse 595"
            class="cls-25"
            cx="44.542"
            cy="424.327"
            r="3.542"
          />
          <circle
            id="Ellipse_596"
            data-name="Ellipse 596"
            class="cls-25"
            cx="101.21302"
            cy="363.878"
            r="3.542"
          />
          <circle
            id="Ellipse_597"
            data-name="Ellipse 597"
            class="cls-25"
            cx="157.88398"
            cy="392.21299"
            r="3.542"
          />
          <circle
            id="Ellipse_598"
            data-name="Ellipse 598"
            class="cls-25"
            cx="216.44502"
            cy="363.878"
            r="3.542"
          />
          <circle
            id="Ellipse_599"
            data-name="Ellipse 599"
            class="cls-25"
            cx="273.11597"
            cy="363.878"
            r="3.542"
          />
          <circle
            id="Ellipse_600"
            data-name="Ellipse 600"
            class="cls-25"
            cx="329.787"
            cy="392.21299"
            r="3.542"
          />
          <circle
            id="Ellipse_601"
            data-name="Ellipse 601"
            class="cls-25"
            cx="386.45802"
            cy="335.542"
            r="3.542"
          />
        </g>
        <g id="Group_1270" data-name="Group 1270">
          <g id="Group_1268-2" data-name="Group 1268-2">
            <line
              id="Line_225-2"
              data-name="Line 225-2"
              class="cls-20"
              x1="755.40198"
              y1="507.44398"
              x2="411.59698"
              y2="507.44398"
            />
            <line
              id="Line_226-2"
              data-name="Line 226-2"
              class="cls-20"
              x1="411.59698"
              y1="334.59698"
              x2="755.40198"
              y2="334.59698"
            />
            <line
              id="Line_227-2"
              data-name="Line 227-2"
              class="cls-20"
              x1="411.59698"
              y1="478.63599"
              x2="755.40198"
              y2="478.63599"
            />
            <line
              id="Line_228-2"
              data-name="Line 228-2"
              class="cls-20"
              x1="411.59698"
              y1="449.82799"
              x2="755.40198"
              y2="449.82799"
            />
            <line
              id="Line_229-2"
              data-name="Line 229-2"
              class="cls-20"
              x1="411.59698"
              y1="421.02099"
              x2="755.40198"
              y2="421.02099"
            />
            <line
              id="Line_230-2"
              data-name="Line 230-2"
              class="cls-20"
              x1="411.59698"
              y1="392.21299"
              x2="755.40198"
              y2="392.21299"
            />
            <line
              id="Line_231-2"
              data-name="Line 231-2"
              class="cls-20"
              x1="411.59698"
              y1="363.40499"
              x2="755.40198"
              y2="363.40499"
            />
          </g>
          <circle
            id="Ellipse_588-2"
            data-name="Ellipse 588-2"
            class="cls-21"
            cx="412.542"
            cy="482.887"
            r="3.542"
          />
          <circle
            id="Ellipse_589-2"
            data-name="Ellipse 589-2"
            class="cls-21"
            cx="469.21302"
            cy="424.327"
            r="3.542"
          />
          <circle
            id="Ellipse_590-2"
            data-name="Ellipse 590-2"
            class="cls-21"
            cx="525.88398"
            cy="452.662"
            r="3.542"
          />
          <circle
            id="Ellipse_591-2"
            data-name="Ellipse 591-2"
            class="cls-21"
            cx="584.44502"
            cy="424.327"
            r="3.542"
          />
          <circle
            id="Ellipse_592-2"
            data-name="Ellipse 592-2"
            class="cls-21"
            cx="641.11597"
            cy="395.99101"
            r="3.542"
          />
          <circle
            id="Ellipse_593-2"
            data-name="Ellipse 593-2"
            class="cls-21"
            cx="697.787"
            cy="454.551"
            r="3.542"
          />
          <circle
            id="Ellipse_594-2"
            data-name="Ellipse 594-2"
            class="cls-21"
            cx="754.45802"
            cy="367.65601"
            r="3.542"
          />
          <line
            id="Line_232-2"
            data-name="Line 232-2"
            class="cls-22"
            x1="415.37598"
            y1="480.05301"
            x2="466.37998"
            y2="427.16"
          />
          <line
            id="Line_233-2"
            data-name="Line 233-2"
            class="cls-22"
            x1="472.047"
            y1="425.271"
            x2="523.051"
            y2="451.718"
          />
          <line
            id="Line_234-2"
            data-name="Line 234-2"
            class="cls-22"
            x1="528.71802"
            y1="451.718"
            x2="581.61102"
            y2="425.271"
          />
          <line
            id="Line_235-2"
            data-name="Line 235-2"
            class="cls-22"
            x1="587.27802"
            y1="423.38301"
            x2="638.28202"
            y2="396.936"
          />
          <line
            id="Line_236-2"
            data-name="Line 236-2"
            class="cls-22"
            x1="643.94897"
            y1="398.82501"
            x2="694.95298"
            y2="453.60701"
          />
          <line
            id="Line_237-2"
            data-name="Line 237-2"
            class="cls-22"
            x1="700.62"
            y1="451.71801"
            x2="753.513"
            y2="370.48901"
          />
          <path id="Path_1414-2" data-name="Path 1414-2" class="cls-24" d="M411.597,425.271l56.671-60.449,56.671,28.336,58.56-28.336h56.671l56.671,28.336L753.513,336.486" />
          <circle
            id="Ellipse_595-2"
            data-name="Ellipse 595-2"
            class="cls-25"
            cx="412.542"
            cy="424.327"
            r="3.542"
          />
          <circle
            id="Ellipse_596-2"
            data-name="Ellipse 596-2"
            class="cls-25"
            cx="469.21302"
            cy="363.878"
            r="3.542"
          />
          <circle
            id="Ellipse_597-2"
            data-name="Ellipse 597-2"
            class="cls-25"
            cx="525.88398"
            cy="392.21299"
            r="3.542"
          />
          <circle
            id="Ellipse_598-2"
            data-name="Ellipse 598-2"
            class="cls-25"
            cx="584.44502"
            cy="363.878"
            r="3.542"
          />
          <circle
            id="Ellipse_599-2"
            data-name="Ellipse 599-2"
            class="cls-25"
            cx="641.11597"
            cy="363.878"
            r="3.542"
          />
          <circle
            id="Ellipse_600-2"
            data-name="Ellipse 600-2"
            class="cls-25"
            cx="697.787"
            cy="392.21299"
            r="3.542"
          />
          <circle
            id="Ellipse_601-2"
            data-name="Ellipse 601-2"
            class="cls-25"
            cx="754.45802"
            cy="335.542"
            r="3.542"
          />
        </g>
        <g id="Group_1271" data-name="Group 1271">
          <g id="Group_1268-3" data-name="Group 1268-3">
            <line
              id="Line_225-3"
              data-name="Line 225-3"
              class="cls-20"
              x1="1123.40198"
              y1="507.44398"
              x2="779.59698"
              y2="507.44398"
            />
            <line
              id="Line_226-3"
              data-name="Line 226-3"
              class="cls-20"
              x1="779.59698"
              y1="334.59698"
              x2="1123.40198"
              y2="334.59698"
            />
            <line
              id="Line_227-3"
              data-name="Line 227-3"
              class="cls-20"
              x1="779.59698"
              y1="478.63599"
              x2="1123.40198"
              y2="478.63599"
            />
            <line
              id="Line_228-3"
              data-name="Line 228-3"
              class="cls-20"
              x1="779.59698"
              y1="449.82799"
              x2="1123.40198"
              y2="449.82799"
            />
            <line
              id="Line_229-3"
              data-name="Line 229-3"
              class="cls-20"
              x1="779.59698"
              y1="421.02099"
              x2="1123.40198"
              y2="421.02099"
            />
            <line
              id="Line_230-3"
              data-name="Line 230-3"
              class="cls-20"
              x1="779.59698"
              y1="392.21299"
              x2="1123.40198"
              y2="392.21299"
            />
            <line
              id="Line_231-3"
              data-name="Line 231-3"
              class="cls-20"
              x1="779.59698"
              y1="363.40499"
              x2="1123.40198"
              y2="363.40499"
            />
          </g>
          <circle
            id="Ellipse_588-3"
            data-name="Ellipse 588-3"
            class="cls-21"
            cx="780.542"
            cy="482.887"
            r="3.542"
          />
          <circle
            id="Ellipse_589-3"
            data-name="Ellipse 589-3"
            class="cls-21"
            cx="837.21302"
            cy="424.327"
            r="3.542"
          />
          <circle
            id="Ellipse_590-3"
            data-name="Ellipse 590-3"
            class="cls-21"
            cx="893.88398"
            cy="452.662"
            r="3.542"
          />
          <circle
            id="Ellipse_591-3"
            data-name="Ellipse 591-3"
            class="cls-21"
            cx="952.44502"
            cy="424.327"
            r="3.542"
          />
          <circle
            id="Ellipse_592-3"
            data-name="Ellipse 592-3"
            class="cls-21"
            cx="1009.11597"
            cy="395.99101"
            r="3.542"
          />
          <circle
            id="Ellipse_593-3"
            data-name="Ellipse 593-3"
            class="cls-21"
            cx="1065.787"
            cy="454.551"
            r="3.542"
          />
          <circle
            id="Ellipse_594-3"
            data-name="Ellipse 594-3"
            class="cls-21"
            cx="1122.45802"
            cy="367.65601"
            r="3.542"
          />
          <line
            id="Line_232-3"
            data-name="Line 232-3"
            class="cls-22"
            x1="783.37598"
            y1="480.05301"
            x2="834.37998"
            y2="427.16"
          />
          <line
            id="Line_233-3"
            data-name="Line 233-3"
            class="cls-22"
            x1="840.047"
            y1="425.271"
            x2="891.051"
            y2="451.718"
          />
          <line
            id="Line_234-3"
            data-name="Line 234-3"
            class="cls-22"
            x1="896.71802"
            y1="451.718"
            x2="949.61102"
            y2="425.271"
          />
          <line
            id="Line_235-3"
            data-name="Line 235-3"
            class="cls-22"
            x1="955.27802"
            y1="423.38301"
            x2="1006.28202"
            y2="396.936"
          />
          <line
            id="Line_236-3"
            data-name="Line 236-3"
            class="cls-22"
            x1="1011.94897"
            y1="398.82501"
            x2="1062.95298"
            y2="453.60701"
          />
          <line
            id="Line_237-3"
            data-name="Line 237-3"
            class="cls-22"
            x1="1068.62"
            y1="451.71801"
            x2="1121.513"
            y2="370.48901"
          />
          <path id="Path_1414-3" data-name="Path 1414-3" class="cls-24" d="M779.597,425.271l56.671-60.449,56.671,28.336,58.56-28.336h56.671l56.671,28.336,56.67194-56.672" />
          <circle
            id="Ellipse_595-3"
            data-name="Ellipse 595-3"
            class="cls-25"
            cx="780.542"
            cy="424.327"
            r="3.542"
          />
          <circle
            id="Ellipse_596-3"
            data-name="Ellipse 596-3"
            class="cls-25"
            cx="837.21302"
            cy="363.878"
            r="3.542"
          />
          <circle
            id="Ellipse_597-3"
            data-name="Ellipse 597-3"
            class="cls-25"
            cx="893.88398"
            cy="392.21299"
            r="3.542"
          />
          <circle
            id="Ellipse_598-3"
            data-name="Ellipse 598-3"
            class="cls-25"
            cx="952.44502"
            cy="363.878"
            r="3.542"
          />
          <circle
            id="Ellipse_599-3"
            data-name="Ellipse 599-3"
            class="cls-25"
            cx="1009.11597"
            cy="363.878"
            r="3.542"
          />
          <circle
            id="Ellipse_600-3"
            data-name="Ellipse 600-3"
            class="cls-25"
            cx="1065.787"
            cy="392.21299"
            r="3.542"
          />
          <circle
            id="Ellipse_601-3"
            data-name="Ellipse 601-3"
            class="cls-25"
            cx="1122.45802"
            cy="335.542"
            r="3.542"
          />
        </g>
        <g id="Success_Rates" data-name="Success Rates" class="cls-2">
          <text class="cls-26" transform="translate(47 309)">
            Success Rates
          </text>
        </g>
        <g id="Request_Volumes" data-name="Request Volumes" class="cls-2">
          <text class="cls-26" transform="translate(408.99999 309)">
            Request Volumes
          </text>
        </g>
        <g id="Latency" class="cls-2">
          <text class="cls-26" transform="translate(770.99999 309)">
            Latency
          </text>
        </g>
        <line
          id="Line_238"
          data-name="Line 238"
          class="cls-31"
          x1="299.5"
          y1="0.5"
          x2="299.5"
          y2="245.5"
        />
        <line
          id="Line_239"
          data-name="Line 239"
          class="cls-31"
          x1="299.5"
          y1="122.5"
          x2="0.5"
          y2="122.5"
        />
      </svg>
    </div>
  </div>
</template>
