/* RACING LAB HYBRID PRO — visual layer only.
   Does not alter forecasts, racing logic, app state, fetches, or simulator calculations. */
(()=>{"use strict";
const CSS=`
:root{--bg:#03080d!important;--sidebar:#071019!important;--surface:#0a1920!important;--surface2:#10252d!important;--surface3:#14313a!important;--line:#214e50!important;--line2:#19383e!important;--ink:#eafaf6!important;--muted:#9cbcb9!important;--dim:#688f8d!important;--accent:#29efaa!important;--accent2:#13bd99!important;--gold:#f8c45b!important;--blue:#51bfff!important;--radius:11px!important;--shadow:0 12px 36px #0009!important}
html{background:#03080d!important}body{background:radial-gradient(ellipse 55% 32% at 60% -8%,#0e534e55,transparent 85%),#03080d!important;color:#eafaf6!important;font-family:Inter,system-ui,-apple-system,sans-serif!important}
.app{grid-template-columns:218px minmax(0,1fr)!important}
.sidebar{width:218px!important;padding:18px 11px!important;background:linear-gradient(180deg,#07131b,#050d14)!important;border-right:1px solid #174c4a!important;box-shadow:12px 0 35px #0005!important}
.brand{padding:5px 9px 23px!important;gap:11px!important}.brand-mark{background:linear-gradient(140deg,#33f6b2,#119f90)!important;width:43px!important;height:43px!important;border-radius:10px!important;color:#04221b!important;box-shadow:0 0 30px #12dca94d!important}.brand-title{font-size:18px!important;letter-spacing:-.055em!important}.brand-sub{color:#28ecb0!important;letter-spacing:.2em!important;font-size:9px!important}
.nav-group{font-size:9px!important;color:#709b9b!important;letter-spacing:.16em!important;padding:17px 10px 8px!important}
.navbtn{border-radius:7px!important;padding:10px 12px!important;font-size:12px!important;font-weight:700!important;color:#a2c0bd!important;min-height:41px!important;border:1px solid transparent!important;margin:2px 0!important}
.navbtn.active{background:linear-gradient(90deg,#095c46,#0b2d31)!important;color:#b2ffda!important;border:1px solid #139f7a!important;box-shadow:inset 3px 0 #38f8b7,0 0 17px #12c58b19!important}
.navbtn:hover{background:#0d3536!important;color:#fff!important}
.sidebar-foot{background:linear-gradient(145deg,#0c302d,#0a1b27)!important;border:1px solid #1b6857!important;border-radius:10px!important}
.shell{padding:0 clamp(14px,2vw,32px) 65px!important}.topbar{height:70px!important;border-bottom:1px solid #19524e!important}.topbar-left strong{font-size:17px!important;letter-spacing:-.035em!important}.eyebrow{color:#24f1af!important;font-size:9px!important;letter-spacing:.18em!important}.topdate{color:#b7d3d0!important}
.page{max-width:1920px!important;padding-top:23px!important}.page-head{margin-bottom:20px!important}.page-head h1{font-size:clamp(30px,3vw,43px)!important;letter-spacing:-.055em!important;font-weight:900!important}.lede{color:#a7c3c0!important;font-size:12px!important}
.hero{position:relative!important;overflow:hidden!important;background:linear-gradient(100deg,#09252bcf,#0c2d32ba 54%,#071923b0),radial-gradient(ellipse at 90% 10%,#167f5b6e,transparent 58%)!important;border:1px solid #198a71!important;border-radius:12px!important;padding:25px!important;box-shadow:0 12px 40px #0009,inset 0 1px #b6ffce22!important}
.hero:before{content:"RACING LAB / INTELLIGENCE TERMINAL";display:block;color:#40eeb8;letter-spacing:.22em;font-size:9px;font-weight:900;margin-bottom:11px;pointer-events:none}
.hero:after{content:"◈";position:absolute;right:18px;top:0;font-size:125px;line-height:1;color:#38efa610;pointer-events:none}
.grid{gap:12px!important}.section-space{margin-top:18px!important}
.card,.track-card,.race-tile,.compare-card,.mini-race,.weather-course,.weather-strip,.stat,.multi-slot,.qa-item,.s3-engine-card,.s3-sidebar,.s3-stage,.s3-hero,.s3-result,.dialog{background:linear-gradient(145deg,#10232b,#091720)!important;border:1px solid #1b4b4b!important;border-radius:10px!important;box-shadow:0 7px 22px #0006!important;transition:border-color .2s,transform .2s,box-shadow .2s!important}
.card,.track-card,.compare-card,.weather-course,.s3-engine-card{padding:18px!important}
.card:hover,.track-card:hover,.race-tile:hover,.compare-card:hover{border-color:#21a788!important;box-shadow:0 9px 28px #0008,0 0 15px #18d6a313!important}
.kpis{gap:11px!important}.stat{padding:16px!important;min-height:90px!important;position:relative!important;overflow:hidden!important}
.stat:after{content:"";position:absolute;right:-20px;top:-20px;width:78px;height:78px;border-radius:50%;border:1px solid #23a67a23;box-shadow:0 0 0 16px #24ab7b0a;pointer-events:none}
.stat .number,.stat .valuebig,.valuebig{font-size:clamp(24px,2.6vw,35px)!important;font-weight:900!important;letter-spacing:-.065em!important}.stat .label,.label{color:#8caaa9!important;letter-spacing:.11em!important;text-transform:uppercase!important;font-size:10px!important;font-weight:800!important}
.card-header h2,.card h2,.section-row h2{font-size:16px!important;font-weight:850!important;letter-spacing:-.03em!important}
.race-grid{gap:9px!important}.race-tile{padding:15px!important;position:relative!important}.race-tile.active{border-color:#2cfaac!important;background:linear-gradient(145deg,#124d3e,#0b232b)!important;box-shadow:inset 0 0 0 1px #27e7a866,0 0 18px #17d7a32e!important}.race-n{color:#36f1b3!important;font-size:11px!important;font-weight:900!important}.race-tile .leader{font-size:14px!important;font-weight:850!important}.pct,.strongnum{color:#2cf5b0!important;font-weight:900!important}
.btn,.linkbtn{border-radius:7px!important;font-weight:800!important}.btn{min-height:37px!important;padding:9px 14px!important}.btn.outline{background:#0e2b31!important;border:1px solid #23655f!important;color:#c5fff0!important}.btn:hover{filter:brightness(1.14)}
.tabs{background:#07171d!important;border:1px solid #1b4b4b!important;border-radius:9px!important;padding:4px!important;gap:5px!important}.tabs button{border-radius:6px!important;font-size:11px!important;font-weight:800!important}.tabs button.active{background:linear-gradient(180deg,#0b8b68,#075d4b)!important;color:#e4fff2!important;box-shadow:0 3px 10px #0006!important}
.pill,.status,.qualitychip{border-radius:5px!important;font-size:10px!important;font-weight:850!important}.pill.green,.status.good{background:#0b4236!important;border-color:#139f77!important;color:#6cffca!important}.pill.orange,.status.warn{background:#392814!important;color:#ffd184!important}
.tablewrap{border:1px solid #1c4c4a!important;border-radius:9px!important;overflow:auto!important}table{background:#091820!important;border-collapse:collapse!important}thead{background:#102e32!important}th{font-size:10px!important;color:#91b6b1!important;letter-spacing:.12em!important;text-transform:uppercase!important;padding:12px!important}td{font-size:12px!important;padding:11px 12px!important;border-bottom:1px solid #163b3c!important}tbody tr:nth-child(even){background:#0d242a88!important}tbody tr:hover{background:#12423888!important}
.bar-meter,.bar,.progress{border-radius:99px!important;overflow:hidden!important}
.weather-strip{background:linear-gradient(110deg,#123b38,#0b2330)!important;padding:16px!important}.weather-course{padding:15px!important}
.field-row,.compare-row,.order-row,.qa-item,.evidence-item{border-bottom-color:#1b4345!important}.field-row:hover,.compare-row:hover,.order-row:hover{background:#16433b55!important}
.s3-hero{background:radial-gradient(ellipse at 80% 0%,#0f7c6266,transparent 60%),linear-gradient(130deg,#102a32,#071721)!important;padding:20px!important;border-color:#198d77!important}
.s3-stage{padding:10px!important;background:linear-gradient(150deg,#091e25,#061219)!important}.s3-canvas-shell{border:1px solid #1d8072!important;border-radius:9px!important;box-shadow:0 12px 40px #0009!important;overflow:hidden!important}
.s3-primary-play{background:linear-gradient(135deg,#27f1ad,#0a9e80)!important;color:#04251e!important;border-radius:7px!important;box-shadow:0 5px 25px #12e9a64d!important}
.s3-runner{border-radius:7px!important}.s3-runner.selected{background:#145442!important;border-color:#2ff3b3!important}.s3-commentary{border-left:3px solid #1de4a6!important;background:#0b292c!important;padding:13px!important;border-radius:0 7px 7px 0!important}
.s3-podium-runner,.multi-slot{border-radius:9px!important}.multi-slot.filled{border-color:#23b98e!important;background:#104537!important}
input,select{background:#0e2730!important;border:1px solid #24605c!important;border-radius:7px!important;color:#e7fff6!important;min-height:38px!important}input:focus,select:focus{outline:2px solid #27e8ac!important}
.overlay{backdrop-filter:blur(13px)!important;background:#02090bcb!important}.dialog{border-color:#238d7b!important}
.hp-mode-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid #12684f;border-radius:5px;color:#56f6bb;background:#0b302a;font-size:9px;letter-spacing:.14em;font-weight:900;white-space:nowrap}
.hp-mode-chip:before{content:"";width:6px;height:6px;background:#2ff6aa;border-radius:50%;box-shadow:0 0 10px #2ff6aa}
@media(min-width:1100px){.app{grid-template-columns:218px minmax(0,1fr)!important}}
@media(max-width:1099px){.app{grid-template-columns:1fr!important}.sidebar{display:none!important}.shell{padding:0 13px 95px!important}.mobile-nav{display:flex!important;background:#06161bed!important;border-top:1px solid #207566!important;backdrop-filter:blur(18px)!important;box-shadow:0 -10px 35px #000b!important}.page{padding-top:18px!important}}
@media(max-width:680px){.topbar{height:65px!important}.page-head h1{font-size:30px!important}.hero{padding:18px!important}.hero:after{font-size:70px!important}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important}.stat{min-height:88px!important;padding:12px!important}.stat .number,.stat .valuebig{font-size:26px!important}.grid.two,.grid.three{grid-template-columns:1fr!important}.card,.track-card,.compare-card{padding:13px!important}.race-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.race-tile{padding:12px!important}.race-tile .leader{font-size:12px!important}.topdate{font-size:10px!important}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`;
function install(){if(document.getElementById('racing-lab-hybrid-pro-style'))return;const style=document.createElement('style');style.id='racing-lab-hybrid-pro-style';style.textContent=CSS;document.head.appendChild(style);const mount=()=>{const bar=document.querySelector('.topbar-right');if(bar&&!bar.querySelector('.hp-mode-chip')){const chip=document.createElement('span');chip.className='hp-mode-chip';chip.textContent='HYBRID PRO';chip.title='Visual makeover active; data and simulations unchanged';bar.prepend(chip)}};mount();const observer=new MutationObserver(()=>{if(!document.body.isConnected)return;mount()});observer.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

/* HYBRID PRO — COMMAND CENTRE V2 */
(() => {
  const css = `
    .hp-command {
      display: grid;
      grid-template-columns: 1.7fr 1fr;
      gap: 14px;
      margin: 18px 0 24px;
    }
    .hp-main {
      min-height: 320px;
      padding: 32px;
      border-radius: 16px;
      border: 1px solid #188c70;
      background:
        radial-gradient(circle at 85% 20%,
          #167b6155, transparent 55%),
        linear-gradient(120deg, #071820, #103e3a);
      box-shadow: 0 20px 50px #0008;
    }
    .hp-kicker {
      color: #38f2b3;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 3px;
    }
    .hp-main h2 {
      font-size: clamp(40px, 5vw, 70px);
      line-height: 1;
      letter-spacing: -3px;
      margin: 28px 0 18px;
      color: white;
    }
    .hp-main h2 span { color: #39efb1; }
    .hp-main p {
      color: #aacbc5;
      max-width: 460px;
      line-height: 1.7;
      font-size: 13px;
    }
    .hp-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 25px;
    }
    .hp-actions button {
      padding: 13px 17px;
      border-radius: 7px;
      border: 1px solid #32eab1;
      background: #2be5a8;
      color: #05231c;
      font-weight: 900;
      cursor: pointer;
    }
    .hp-actions button + button {
      background: #10332f;
      color: #baffdf;
    }
    .hp-side {
      display: grid;
      gap: 14px;
    }
    .hp-panel {
      padding: 22px;
      border-radius: 14px;
      border: 1px solid #21665a;
      background: linear-gradient(140deg,
        #123533, #091923);
    }
    .hp-panel small {
      color: #43efb7;
      font-weight: 900;
      letter-spacing: 2px;
    }
    .hp-panel h3 {
      color: #f0fff9;
      font-size: 21px;
      margin: 18px 0 8px;
    }
    .hp-panel p {
      color: #a5c6bf;
      font-size: 12px;
      line-height: 1.6;
    }
    @media (max-width: 850px) {
      .hp-command { grid-template-columns: 1fr; }
      .hp-main { padding: 24px; }
      .hp-side { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 550px) {
      .hp-side { grid-template-columns: 1fr; }
      .hp-main h2 { font-size: 44px; }
    }
  `;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  function enhance() {
    const screen = document.querySelector("#screen");
    if (!screen) return;

    const home = document.querySelector(
      '.navbtn[data-page="home"].active'
    );
    if (!home) return;
    if (screen.querySelector(".hp-command")) return;

    const panel = document.createElement("section");
    panel.className = "hp-command";
    panel.innerHTML = `
      <div class="hp-main">
        <div class="hp-kicker">
          RACING LAB / HYBRID PRO
        </div>
        <h2>THE RACE.<br><span>DECODED.</span></h2>
        <p>
          Professional racing intelligence.
          Explore whole-field probabilities,
          runner comparisons and race simulations.
        </p>
        <div class="hp-actions">
          <button data-page="races">
            EXPLORE RACES ↗
          </button>
          <button data-page="simulator">
            LAUNCH SIMULATOR ◉
          </button>
        </div>
      </div>
      <div class="hp-side">
        <div class="hp-panel">
          <small>01 / ANALYSIS DESK</small>
          <h3>ELITE TRADER</h3>
          <p>Race forecasts, rankings,
          quality checks and runner comparisons.</p>
        </div>
        <div class="hp-panel">
          <small>02 / RACE ENGINE</small>
          <h3>IMMERSIVE RACE VIEW</h3>
          <p>Visual race simulation,
          runner tracking and replay controls.</p>
        </div>
      </div>
    `;

    screen.prepend(panel);
    panel.querySelectorAll("[data-page]")
      .forEach(button => {
        button.addEventListener("click", () => {
          document.querySelector(
            `.sidebar .navbtn[data-page="${button.dataset.page}"]`
          )?.click();
        });
      });
  }

  const observer = new MutationObserver(enhance);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  enhance();
})();
