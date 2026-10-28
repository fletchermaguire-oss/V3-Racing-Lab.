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

/* HYBRID PRO 3 — presentation-only expansion. Preserve original engine. */
(()=>{'use strict';if(window.__hp3)return;window.__hp3=true;
const css=`
:root{--accent:#34f3b3!important;--accent2:#11a98b;--hp3-bg:#070c13;--hp3-panel:#101b27;--hp3-line:rgba(137,180,204,.16);--hp3-text:#e9f5f6;--hp3-muted:#91a9b8}
html{background:var(--hp3-bg)!important;scroll-behavior:smooth}
body{background:radial-gradient(ellipse at 80% 0%,rgba(13,116,119,.16),transparent 36%),#070c13!important;color:var(--hp3-text)!important}
.app{background:transparent!important}
.sidebar{background:linear-gradient(180deg,#0b1622,#080e17)!important;border-right:1px solid var(--hp3-line)!important;box-shadow:8px 0 35px #0003}
.brand{padding-top:24px!important;padding-bottom:24px!important}
.brand-mark{box-shadow:0 0 28px rgba(52,243,179,.22)!important}
.brand-title{font-weight:900!important;letter-spacing:-.06em!important}
.brand-sub{color:#79a99f!important;letter-spacing:.13em!important;text-transform:uppercase}
.nav-group{color:#78919d!important;letter-spacing:.16em!important;font-size:10px!important}
.navbtn{border:1px solid transparent!important;border-radius:12px!important;margin:3px 0!important;transition:background .2s,border-color .2s,transform .2s!important}
.navbtn:hover{background:#132b36!important;border-color:#235c60!important;transform:translateX(2px)}
.navbtn.active{background:linear-gradient(100deg,rgba(52,243,179,.17),rgba(28,121,147,.09))!important;border-color:rgba(52,243,179,.31)!important;box-shadow:inset 3px 0 #34f3b3!important}
.topbar{background:rgba(8,16,25,.9)!important;backdrop-filter:blur(18px)!important;border-bottom:1px solid var(--hp3-line)!important;min-height:67px!important}
.topdate,.pill,.status{border-radius:100px!important}
.page{background:transparent!important;padding-top:28px!important}
.page-head{position:relative;padding:4px 0 16px!important;margin-bottom:17px!important;border-bottom:1px solid var(--hp3-line)}
.page-head h1,.page-head h2{font-weight:900!important;letter-spacing:-.055em!important;line-height:1.05!important}
.lede{color:var(--hp3-muted)!important;line-height:1.6!important}
.card,.track-card,.compare-card,.qualitychip,.s3-engine-card,.s3-hero,.s3-sidebar,.s3-stage,.s3-commentary,.sim-layout,.track-view,.weather-course,.weather-strip,.weather-brief,.stat,.race-tile,.mini-race{background:linear-gradient(145deg,rgba(18,33,47,.96),rgba(9,20,32,.98))!important;border:1px solid var(--hp3-line)!important;border-radius:17px!important;box-shadow:0 12px 36px rgba(0,0,0,.13)!important}
.card:hover,.track-card:hover,.race-tile:hover,.mini-race:hover{border-color:rgba(52,243,179,.35)!important}
.card,.track-card,.race-tile,.mini-race{transition:border-color .2s,box-shadow .2s,transform .2s!important}
.race-tile:hover,.mini-race:hover{transform:translateY(-2px);box-shadow:0 15px 35px #0005!important}
.card-header,.section-row{border-bottom-color:var(--hp3-line)!important}
.grid{gap:16px!important}
.kpis{gap:14px!important}
.stat{padding:19px!important;position:relative;overflow:hidden}
.stat:before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#34f3b3,transparent);opacity:.8}
.stat .number,.valuebig,.strongnum{color:#ecfffa!important;font-weight:900!important;letter-spacing:-.06em!important;font-variant-numeric:tabular-nums}
.stat .label,.label,.mini{color:#8ba7b7}
.btn,button.btn,.linkbtn{border-radius:11px!important;transition:transform .18s,filter .18s,box-shadow .18s!important}
.btn:hover,button.btn:hover{transform:translateY(-1px);filter:brightness(1.12)}
.btn.primary,.btn-primary{background:linear-gradient(110deg,#2de6ab,#12adbb)!important;color:#041b21!important;font-weight:850!important;box-shadow:0 6px 24px #12adbb22!important}
.btn.outline{background:rgba(21,43,56,.8)!important;border-color:#2d5962!important;color:#c4fff0!important}
input,select,textarea,.input,.select{background:#0b1b29!important;color:#e6f6f8!important;border:1px solid #2a4555!important;border-radius:10px!important}
input:focus,select:focus,textarea:focus{outline:2px solid #34f3b366!important;outline-offset:1px}
.tabs{background:rgba(8,20,31,.72)!important;border:1px solid var(--hp3-line)!important;border-radius:13px!important;padding:5px!important;gap:4px!important}
.tabs button,.tabs .btn{border-radius:9px!important}
table,.cal-table{border-collapse:separate!important;border-spacing:0!important;width:100%!important}
table th,.cal-table th{background:#102432!important;color:#9fcecf!important;text-transform:uppercase!important;letter-spacing:.09em!important;font-size:10px!important;position:sticky;top:0;z-index:2}
table th,table td,.cal-table th,.cal-table td{border-bottom:1px solid rgba(143,188,201,.12)!important;padding:11px 12px!important}
table tbody tr:nth-child(even){background:rgba(255,255,255,.018)}
table tbody tr:hover{background:rgba(52,243,179,.065)!important}
.field-row,.compare-row,.order-row,.qa-item,.evidence-item{border-bottom:1px solid var(--hp3-line)!important;transition:background .15s}
.field-row:hover,.compare-row:hover,.order-row:hover{background:rgba(52,243,179,.045)!important}
.pct{font-variant-numeric:tabular-nums;font-weight:850!important;color:#57efc0!important}
.bar-meter,.two-bar,.progress{background:#132b39!important;border-radius:100px!important;overflow:hidden}
.bar-meter>*,.two-bar>*,.progress>*{background:linear-gradient(90deg,#13a9bb,#3af4af)!important}
.track-card .top,.weather-course-head{padding-bottom:12px!important;border-bottom:1px solid var(--hp3-line)!important}
.track-rating,.surface,.qualitychip{font-weight:750!important}
.race-grid{gap:12px!important}
.race-tile{padding:17px!important;position:relative;overflow:hidden}
.race-tile:before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(#30f2b2,#1684a5);opacity:.7}
.race-n{font-size:11px!important;font-weight:850!important;letter-spacing:.12em!important}
.leader{font-weight:800!important;letter-spacing:-.025em!important}
.weather-strip{padding:20px!important}
.weather-status{font-weight:800!important}
.weather-course{padding:17px!important}
.hour-pill{border-color:#29505a!important;background:#102b36!important}
.multi-slot{background:linear-gradient(135deg,#102837,#0a1724)!important;border:1px dashed #35646a!important;border-radius:15px!important}
.slotcount{background:#2be2b1!important;color:#04222a!important}
.compare-card{padding:20px!important}
.overlay{backdrop-filter:blur(12px)!important;background:rgba(1,8,14,.82)!important}
.dialog{background:#0c1825!important;border:1px solid #345460!important;border-radius:21px!important;box-shadow:0 30px 100px #000a!important}
.s3-hero{background:linear-gradient(120deg,#102c3b,#0b1a2a)!important;position:relative;overflow:hidden}
.s3-hero:after{content:"";position:absolute;right:-80px;top:-130px;width:300px;height:300px;border:1px solid #34f3b322;border-radius:50%;pointer-events:none}
.s3-topline{letter-spacing:.08em!important}
.s3-live-dot{box-shadow:0 0 0 5px #34f3b31c,0 0 20px #34f3b388!important}
.s3-statbar{background:#0b202c!important;border:1px solid var(--hp3-line)!important;border-radius:13px!important}
.s3-control-bar,.s3-camera-nav{background:#0b1d2b!important;border:1px solid var(--hp3-line)!important;border-radius:13px!important;padding:9px!important}
.s3-stage{background:radial-gradient(ellipse at 50% 90%,#153d3c,#091522 70%)!important;border:1px solid #315866!important;box-shadow:inset 0 0 70px #0007,0 25px 55px #0005!important;overflow:hidden}
.s3-canvas-shell{background:linear-gradient(180deg,#0c2b3a,#0a1823)!important;border-radius:13px!important;overflow:hidden}
.s3-screen-top,.s3-screen-bottom{background:rgba(5,16,25,.84)!important;backdrop-filter:blur(8px)!important}
.s3-screen-clock{color:#49f2bd!important;font-variant-numeric:tabular-nums}
.s3-sidebar{background:#0b1927!important}
.s3-runner{border-radius:10px!important;transition:background .15s,transform .15s}
.s3-runner:hover{background:#183746!important;transform:translateX(2px)}
.s3-runner-bib,.s3-podium-bib{border-radius:8px!important}
.s3-lead{background:linear-gradient(120deg,#143e3a,#103040)!important;border-color:#37cda966!important}
.s3-primary-play{background:linear-gradient(110deg,#2af0b4,#10abc4)!important;color:#05222b!important;box-shadow:0 10px 28px #12bfa333!important}
.s3-commentary{border-left:3px solid #36e4b5!important}
.s3-timeline,.s3-seek-track{background:#204050!important}
.s3-seek-fill{background:linear-gradient(90deg,#17b7c3,#3cf5ae)!important}
.s3-podium{gap:12px!important}
.s3-podium-runner{background:linear-gradient(155deg,#173744,#0d1d2a)!important;border:1px solid #325765!important;border-radius:15px!important}
.s3-result{background:#0c1d2b!important;border:1px solid var(--hp3-line)!important;border-radius:16px!important}
.hp3-section-kicker{display:flex;align-items:center;gap:10px;margin:0 0 17px;color:#55eec2;font-size:10px;font-weight:900;letter-spacing:.19em;text-transform:uppercase}
.hp3-section-kicker:before{content:"";height:2px;width:22px;background:#39efb6;box-shadow:0 0 12px #39efb655}
.hp3-terminal-strip{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 15px;margin-bottom:20px;background:linear-gradient(90deg,#0e2633,#0a1824);border:1px solid #284752;border-radius:12px;color:#91bbc4;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.hp3-terminal-strip strong{color:#40e9b7}
.hp3-terminal-strip .hp3-dots{display:flex;gap:5px}
.hp3-terminal-strip .hp3-dots i{width:6px;height:6px;border-radius:50%;background:#2be3b3;box-shadow:0 0 8px #2be3b366}
.hp3-terminal-strip .hp3-dots i:nth-child(2){background:#e3b767;box-shadow:none}
.hp3-terminal-strip .hp3-dots i:nth-child(3){background:#69889b;box-shadow:none}
.hp3-brandline{display:flex;align-items:center;gap:8px;color:#42eabb;font-weight:900;letter-spacing:.16em;font-size:10px;text-transform:uppercase}
.hp3-brandline:before{content:"";width:7px;height:7px;background:#43eab9;border-radius:50%;box-shadow:0 0 13px #43eab9}
.hp3-glow-rule{height:1px;background:linear-gradient(90deg,transparent,#2adba066,transparent);margin:22px 0}
@media(min-width:1250px){
.page{padding-left:32px!important;padding-right:32px!important}
.grid.two,.weather-two{gap:20px!important}
.s3-stage-layout{grid-template-columns:minmax(0,1fr) minmax(265px,330px)!important;gap:18px!important}
}
@media(max-width:900px){
.sidebar{box-shadow:none!important}
.page{padding:18px 14px!important}
.topbar{min-height:55px!important}
.hp3-terminal-strip{font-size:9px;padding:9px 11px;flex-wrap:wrap}
.card,.track-card,.weather-course{border-radius:13px!important}
.s3-stage-layout{grid-template-columns:1fr!important}
.s3-sidebar{max-height:400px;overflow:auto}
}
@media(max-width:620px){
.page{padding:14px 11px 80px!important}
.page-head h1{font-size:clamp(27px,8vw,37px)!important}
.kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}
.stat{padding:13px!important}
.race-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
.race-tile{padding:12px!important}
.grid.two,.grid.three,.weather-two{grid-template-columns:1fr!important}
.hp3-terminal-strip span:nth-child(2){display:none}
.s3-control-bar{flex-wrap:wrap!important}
.s3-stage{border-radius:12px!important}
.s3-screen-top,.s3-screen-bottom{font-size:10px!important}
table th,table td{padding:9px 7px!important;font-size:11px!important}
}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
`;
const style=document.createElement('style');style.id='hp3-complete-theme';style.textContent=css;document.head.appendChild(style);
const labels={home:'COMMAND CENTRE',races:'RACE INTELLIGENCE',daily:'DAILY RANKINGS',multi:'MULTI LAB',compare:'RUNNER COMPARISON',simulator:'IMMERSIVE RACE VIEW',weather:'TRACK INTELLIGENCE',quality:'MODEL QUALITY',calibration:'CALIBRATION',settings:'SYSTEM SETTINGS'};
let scheduled=false;
function decorate(){
 scheduled=false;
 const page=document.querySelector('#screen');if(!page)return;
 const active=document.querySelector('.sidebar .navbtn.active[data-page]');
 const key=active?.dataset.page||'home';
 page.setAttribute('data-hp3-page',key);
 const header=page.querySelector('.page-head');
 if(header&&!header.querySelector('.hp3-section-kicker')){
 const kicker=document.createElement('div');kicker.className='hp3-section-kicker';kicker.textContent=labels[key]||'RACING INTELLIGENCE';header.prepend(kicker);
 }
 if(!page.querySelector(':scope > .hp3-terminal-strip')){
 const strip=document.createElement('div');strip.className='hp3-terminal-strip';
 const a=document.createElement('span');a.className='hp3-brandline';a.textContent='RACING LAB / HYBRID PRO';
 const b=document.createElement('span');b.textContent='MODEL OUTPUTS • VERIFY LIVE CONDITIONS';
 const c=document.createElement('span');c.className='hp3-dots';c.innerHTML='<i></i><i></i><i></i>';
 strip.append(a,b,c);page.prepend(strip);
 }
}
const obs=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(decorate)});if(document.body)obs.observe(document.body,{childList:true,subtree:true});decorate();
})();

/* RACING LAB V4 — STRUCTURAL DASHBOARD REBUILD */
(() => {
  "use strict";

  if (window.__RACING_LAB_V4__) return;
  window.__RACING_LAB_V4__ = true;

  const style = document.createElement("style");
  style.id = "racing-lab-v4-layout";

  style.textContent = `
    /* Main application */
    body {
      background: #050a10 !important;
    }

    .app {
      background: #050a10 !important;
    }

    #screen {
      max-width: 1900px !important;
      margin: 0 auto !important;
    }

    /* New structural dashboard */
    .v4-workspace {
      display: grid;
      grid-template-columns: minmax(0, 1.8fr) minmax(290px, 1fr);
      gap: 18px;
      align-items: start;
      margin-top: 20px;
    }

    .v4-main,
    .v4-aside {
      display: flex;
      flex-direction: column;
      gap: 18px;
      min-width: 0;
    }

    .v4-main > *,
    .v4-aside > * {
      min-width: 0;
    }

    .v4-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      padding: 28px;
      border-radius: 20px;
      background:
        radial-gradient(circle at 85% 0%,
          rgba(47, 234, 172, .14), transparent 42%),
        linear-gradient(125deg, #102a35, #09131e 75%);
      border: 1px solid rgba(58, 237, 183, .28);
      position: relative;
      overflow: hidden;
    }

    .v4-header::after {
      content: "";
      position: absolute;
      width: 270px;
      height: 270px;
      border: 1px solid rgba(65, 242, 185, .12);
      border-radius: 50%;
      right: -90px;
      top: -150px;
      pointer-events: none;
    }

    .v4-eyebrow {
      color: #48eab9;
      font-size: 10px;
      letter-spacing: .23em;
      font-weight: 900;
      margin-bottom: 11px;
    }

    .v4-title {
      font-size: clamp(32px, 4.3vw, 64px);
      line-height: .98;
      font-weight: 950;
      letter-spacing: -.07em;
      color: #f2fffb;
      margin: 0 0 12px;
    }

    .v4-title span {
      color: #40e9b2;
    }

    .v4-description {
      font-size: 13px;
      color: #9cb7bd;
      max-width: 510px;
      line-height: 1.65;
      margin: 0;
    }

    .v4-header-actions {
      display: flex;
      flex-direction: column;
      gap: 9px;
      min-width: 175px;
      z-index: 1;
    }

    .v4-action {
      appearance: none;
      border: 1px solid #34636b;
      background: #142b38;
      color: #eafff8;
      border-radius: 11px;
      padding: 13px 17px;
      cursor: pointer;
      font-weight: 850;
      font-size: 12px;
      text-align: left;
    }

    .v4-action.primary {
      background: linear-gradient(110deg, #38efb2, #19b9bb);
      border-color: transparent;
      color: #05222a;
    }

    .v4-action:hover {
      filter: brightness(1.12);
    }

    .v4-panel {
      border: 1px solid rgba(130, 183, 200, .19);
      border-radius: 18px;
      background: linear-gradient(155deg, #101f2e, #09141f);
      overflow: hidden;
      min-width: 0;
    }

    .v4-panel-heading {
      padding: 14px 18px;
      border-bottom: 1px solid rgba(130, 183, 200, .16);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .v4-panel-heading strong {
      font-size: 11px;
      font-weight: 900;
      color: #e8fcf7;
      letter-spacing: .13em;
      text-transform: uppercase;
    }

    .v4-panel-heading small {
      color: #43dbae;
      font-size: 9px;
      letter-spacing: .1em;
      font-weight: 800;
    }

    .v4-panel-body {
      padding: 15px;
      min-width: 0;
    }

    .v4-panel-body > .grid {
      width: 100%;
    }

    .v4-panel-body > .kpis {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .v4-panel-body .card {
      margin: 0;
    }

    .v4-panel-body .grid.two,
    .v4-panel-body .grid.three {
      grid-template-columns: 1fr !important;
    }

    .v4-aside .v4-panel {
      position: relative;
    }

    .v4-status {
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 11px;
      border-radius: 13px;
      background: #0e2830;
      border: 1px solid #25595b;
      color: #a9d7d1;
      font-size: 12px;
      font-weight: 700;
    }

    .v4-status-dot {
      width: 8px;
      height: 8px;
      background: #3be8b1;
      border-radius: 50%;
      box-shadow: 0 0 13px #3be8b1;
      flex-shrink: 0;
    }

    .v4-quicklinks {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
    }

    .v4-quicklinks button {
      padding: 16px 12px;
      background: #102533;
      border: 1px solid #28515d;
      color: #d7f4ef;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
      text-align: left;
    }

    .v4-quicklinks button:hover {
      border-color: #3ce6b2;
      background: #173842;
    }

    /* Hide the old injected promotional hero on the new homepage */
    #screen[data-v4-home="true"] > .hp-command {
      display: none !important;
    }

    /* More usable race and simulator workspaces */
    #screen[data-hp3-page="races"] .race-grid {
      grid-template-columns: repeat(
        auto-fit, minmax(180px, 1fr)
      ) !important;
    }

    #screen[data-hp3-page="simulator"] .s3-stage {
      min-height: 370px;
    }

    #screen[data-hp3-page="simulator"] .s3-stage-layout {
      gap: 20px !important;
    }

    @media (max-width: 1050px) {
      .v4-workspace {
        grid-template-columns: 1fr;
      }

      .v4-aside {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: start;
      }
    }

    @media (max-width: 650px) {
      .v4-header {
        flex-direction: column;
        align-items: stretch;
        padding: 23px 19px;
      }

      .v4-header-actions {
        flex-direction: row;
        min-width: 0;
      }

      .v4-action {
        flex: 1;
        padding: 12px 10px;
        font-size: 11px;
      }

      .v4-workspace {
        grid-template-columns: 1fr;
        gap: 13px;
      }

      .v4-aside {
        display: flex;
      }

      .v4-panel-body {
        padding: 11px;
      }

      .v4-title {
        font-size: 37px;
      }

      .v4-quicklinks {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `;

  document.head.appendChild(style);

  const panel = (name, tag = "INTELLIGENCE") => {
    const section = document.createElement("section");
    section.className = "v4-panel";

    const heading = document.createElement("div");
    heading.className = "v4-panel-heading";

    const title = document.createElement("strong");
    title.textContent = name;

    const meta = document.createElement("small");
    meta.textContent = tag;

    heading.append(title, meta);

    const body = document.createElement("div");
    body.className = "v4-panel-body";

    section.append(heading, body);
    return { section, body };
  };

  function navigate(page) {
    const button = document.querySelector(
      '.sidebar .navbtn[data-page="' + page + '"]'
    );

    if (button) button.click();
  }

  function action(label, page, primary = false) {
    const button = document.createElement("button");
    button.className = "v4-action" + (primary ? " primary" : "");
    button.textContent = label;
    button.addEventListener("click", () => navigate(page));
    return button;
  }

  function build() {
    const screen = document.getElementById("screen");
    if (!screen) return;

    const active = document.querySelector(
      '.sidebar .navbtn.active[data-page]'
    );

    if (!active || active.dataset.page !== "home") {
      screen.removeAttribute("data-v4-home");
      return;
    }

    if (screen.querySelector(".v4-workspace")) return;

    // Collect the original dashboard content without cloning it.
    // Moving existing DOM nodes preserves their event listeners.
    const original = Array.from(screen.children).filter(el => {
      return !el.matches(
        ".hp-command, .hp3-terminal-strip, .v4-header, .v4-workspace"
      );
    });

    const header = document.createElement("section");
    header.className = "v4-header";

    const copy = document.createElement("div");
    copy.innerHTML = `
      <div class="v4-eyebrow">
        RACING LAB / HYBRID PRO V4
      </div>
      <h1 class="v4-title">
        THE RACE.<br><span>DECODED.</span>
      </h1>
      <p class="v4-description">
        Your complete racing research command centre.
        Analyse saved model forecasts, compare runners,
        inspect race conditions and explore simulations.
      </p>
    `;

    const actions = document.createElement("div");
    actions.className = "v4-header-actions";
    actions.append(
      action("EXPLORE RACES →", "races", true),
      action("LAUNCH SIMULATOR →", "simulator")
    );

    header.append(copy, actions);

    const workspace = document.createElement("div");
    workspace.className = "v4-workspace";

    const main = document.createElement("div");
    main.className = "v4-main";

    const aside = document.createElement("div");
    aside.className = "v4-aside";

    const overview = panel("Performance Overview", "SAVED MODEL");
    const raceCentre = panel("Race Intelligence", "MEETINGS");
    const research = panel("Research Workspace", "ANALYSIS");

    const rankings = panel("Selection Intelligence", "RANKINGS");
    const secondary = panel("Additional Intelligence", "RESEARCH");

    // Reuse the original elements so actual data and actions remain.
    original.forEach(el => {
      if (el.classList.contains("page-head")) {
        research.body.appendChild(el);
      } else if (
        el.classList.contains("kpis") ||
        el.querySelector(".kpis")
      ) {
        overview.body.appendChild(el);
      } else if (
        el.classList.contains("race-grid") ||
        el.classList.contains("three") ||
        el.querySelector(".race-grid") ||
        el.querySelector(".track-card")
      ) {
        raceCentre.body.appendChild(el);
      } else if (
        el.classList.contains("two") ||
        el.querySelector(".mini-race")
      ) {
        rankings.body.appendChild(el);
      } else {
        secondary.body.appendChild(el);
      }
    });

    if (overview.body.children.length) main.append(overview.section);
    if (raceCentre.body.children.length) main.append(raceCentre.section);
    if (research.body.children.length) main.append(research.section);
    if (rankings.body.children.length) aside.append(rankings.section);
    if (secondary.body.children.length) aside.append(secondary.section);

    const quick = panel("Quick Access", "NAVIGATION");

    const links = document.createElement("div");
    links.className = "v4-quicklinks";

    [
      ["DAILY TOP 10", "daily"],
      ["MULTI LAB", "multi"],
      ["COMPARE", "compare"],
      ["TRACK WEATHER", "weather"],
      ["MODEL QUALITY", "quality"],
      ["CALIBRATION", "calibration"]
    ].forEach(([label, page]) => {
      const button = document.createElement("button");
      button.textContent = label + " ↗";
      button.addEventListener("click", () => navigate(page));
      links.appendChild(button);
    });

    quick.body.appendChild(links);
    aside.prepend(quick.section);

    const status = document.createElement("div");
    status.className = "v4-status";

    const dot = document.createElement("span");
    dot.className = "v4-status-dot";

    const message = document.createElement("span");
    message.textContent =
      "Saved research snapshot — verify current conditions";

    status.append(dot, message);
    aside.prepend(status);

    workspace.append(main, aside);

    const strip = screen.querySelector(
      ":scope > .hp3-terminal-strip"
    );

    if (strip) {
      strip.after(header, workspace);
    } else {
      screen.prepend(header, workspace);
    }

    screen.setAttribute("data-v4-home", "true");
  }

  // Observe the original app's page replacements.
  // Schedule at most one rebuild per animation frame.
  let pending = false;

  function schedule() {
    if (pending) return;

    pending = true;

    requestAnimationFrame(() => {
      pending = false;
      build();
    });
  }

  const observer = new MutationObserver(schedule);

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  schedule();
})();

/* RACING LAB V4 — STRUCTURAL DASHBOARD REBUILD */
(() => {
  "use strict";

  if (window.__RACING_LAB_V4__) return;
  window.__RACING_LAB_V4__ = true;

  const style = document.createElement("style");
  style.id = "racing-lab-v4-layout";

  style.textContent = `
    /* Main application */
    body {
      background: #050a10 !important;
    }

    .app {
      background: #050a10 !important;
    }

    #screen {
      max-width: 1900px !important;
      margin: 0 auto !important;
    }

    /* New structural dashboard */
    .v4-workspace {
      display: grid;
      grid-template-columns: minmax(0, 1.8fr) minmax(290px, 1fr);
      gap: 18px;
      align-items: start;
      margin-top: 20px;
    }

    .v4-main,
    .v4-aside {
      display: flex;
      flex-direction: column;
      gap: 18px;
      min-width: 0;
    }

    .v4-main > *,
    .v4-aside > * {
      min-width: 0;
    }

    .v4-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      padding: 28px;
      border-radius: 20px;
      background:
        radial-gradient(circle at 85% 0%,
          rgba(47, 234, 172, .14), transparent 42%),
        linear-gradient(125deg, #102a35, #09131e 75%);
      border: 1px solid rgba(58, 237, 183, .28);
      position: relative;
      overflow: hidden;
    }

    .v4-header::after {
      content: "";
      position: absolute;
      width: 270px;
      height: 270px;
      border: 1px solid rgba(65, 242, 185, .12);
      border-radius: 50%;
      right: -90px;
      top: -150px;
      pointer-events: none;
    }

    .v4-eyebrow {
      color: #48eab9;
      font-size: 10px;
      letter-spacing: .23em;
      font-weight: 900;
      margin-bottom: 11px;
    }

    .v4-title {
      font-size: clamp(32px, 4.3vw, 64px);
      line-height: .98;
      font-weight: 950;
      letter-spacing: -.07em;
      color: #f2fffb;
      margin: 0 0 12px;
    }

    .v4-title span {
      color: #40e9b2;
    }

    .v4-description {
      font-size: 13px;
      color: #9cb7bd;
      max-width: 510px;
      line-height: 1.65;
      margin: 0;
    }

    .v4-header-actions {
      display: flex;
      flex-direction: column;
      gap: 9px;
      min-width: 175px;
      z-index: 1;
    }

    .v4-action {
      appearance: none;
      border: 1px solid #34636b;
      background: #142b38;
      color: #eafff8;
      border-radius: 11px;
      padding: 13px 17px;
      cursor: pointer;
      font-weight: 850;
      font-size: 12px;
      text-align: left;
    }

    .v4-action.primary {
      background: linear-gradient(110deg, #38efb2, #19b9bb);
      border-color: transparent;
      color: #05222a;
    }

    .v4-action:hover {
      filter: brightness(1.12);
    }

    .v4-panel {
      border: 1px solid rgba(130, 183, 200, .19);
      border-radius: 18px;
      background: linear-gradient(155deg, #101f2e, #09141f);
      overflow: hidden;
      min-width: 0;
    }

    .v4-panel-heading {
      padding: 14px 18px;
      border-bottom: 1px solid rgba(130, 183, 200, .16);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .v4-panel-heading strong {
      font-size: 11px;
      font-weight: 900;
      color: #e8fcf7;
      letter-spacing: .13em;
      text-transform: uppercase;
    }

    .v4-panel-heading small {
      color: #43dbae;
      font-size: 9px;
      letter-spacing: .1em;
      font-weight: 800;
    }

    .v4-panel-body {
      padding: 15px;
      min-width: 0;
    }

    .v4-panel-body > .grid {
      width: 100%;
    }

    .v4-panel-body > .kpis {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .v4-panel-body .card {
      margin: 0;
    }

    .v4-panel-body .grid.two,
    .v4-panel-body .grid.three {
      grid-template-columns: 1fr !important;
    }

    .v4-aside .v4-panel {
      position: relative;
    }

    .v4-status {
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 11px;
      border-radius: 13px;
      background: #0e2830;
      border: 1px solid #25595b;
      color: #a9d7d1;
      font-size: 12px;
      font-weight: 700;
    }

    .v4-status-dot {
      width: 8px;
      height: 8px;
      background: #3be8b1;
      border-radius: 50%;
      box-shadow: 0 0 13px #3be8b1;
      flex-shrink: 0;
    }

    .v4-quicklinks {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
    }

    .v4-quicklinks button {
      padding: 16px 12px;
      background: #102533;
      border: 1px solid #28515d;
      color: #d7f4ef;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
      text-align: left;
    }

    .v4-quicklinks button:hover {
      border-color: #3ce6b2;
      background: #173842;
    }

    /* Hide the old injected promotional hero on the new homepage */
    #screen[data-v4-home="true"] > .hp-command {
      display: none !important;
    }

    /* More usable race and simulator workspaces */
    #screen[data-hp3-page="races"] .race-grid {
      grid-template-columns: repeat(
        auto-fit, minmax(180px, 1fr)
      ) !important;
    }

    #screen[data-hp3-page="simulator"] .s3-stage {
      min-height: 370px;
    }

    #screen[data-hp3-page="simulator"] .s3-stage-layout {
      gap: 20px !important;
    }

    @media (max-width: 1050px) {
      .v4-workspace {
        grid-template-columns: 1fr;
      }

      .v4-aside {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: start;
      }
    }

    @media (max-width: 650px) {
      .v4-header {
        flex-direction: column;
        align-items: stretch;
        padding: 23px 19px;
      }

      .v4-header-actions {
        flex-direction: row;
        min-width: 0;
      }

      .v4-action {
        flex: 1;
        padding: 12px 10px;
        font-size: 11px;
      }

      .v4-workspace {
        grid-template-columns: 1fr;
        gap: 13px;
      }

      .v4-aside {
        display: flex;
      }

      .v4-panel-body {
        padding: 11px;
      }

      .v4-title {
        font-size: 37px;
      }

      .v4-quicklinks {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `;

  document.head.appendChild(style);

  const panel = (name, tag = "INTELLIGENCE") => {
    const section = document.createElement("section");
    section.className = "v4-panel";

    const heading = document.createElement("div");
    heading.className = "v4-panel-heading";

    const title = document.createElement("strong");
    title.textContent = name;

    const meta = document.createElement("small");
    meta.textContent = tag;

    heading.append(title, meta);

    const body = document.createElement("div");
    body.className = "v4-panel-body";

    section.append(heading, body);
    return { section, body };
  };

  function navigate(page) {
    const button = document.querySelector(
      '.sidebar .navbtn[data-page="' + page + '"]'
    );

    if (button) button.click();
  }

  function action(label, page, primary = false) {
    const button = document.createElement("button");
    button.className = "v4-action" + (primary ? " primary" : "");
    button.textContent = label;
    button.addEventListener("click", () => navigate(page));
    return button;
  }

  function build() {
    const screen = document.getElementById("screen");
    if (!screen) return;

    const active = document.querySelector(
      '.sidebar .navbtn.active[data-page]'
    );

    if (!active || active.dataset.page !== "home") {
      screen.removeAttribute("data-v4-home");
      return;
    }

    if (screen.querySelector(".v4-workspace")) return;

    // Collect the original dashboard content without cloning it.
    // Moving existing DOM nodes preserves their event listeners.
    const original = Array.from(screen.children).filter(el => {
      return !el.matches(
        ".hp-command, .hp3-terminal-strip, .v4-header, .v4-workspace"
      );
    });

    const header = document.createElement("section");
    header.className = "v4-header";

    const copy = document.createElement("div");
    copy.innerHTML = `
      <div class="v4-eyebrow">
        RACING LAB / HYBRID PRO V4
      </div>
      <h1 class="v4-title">
        THE RACE.<br><span>DECODED.</span>
      </h1>
      <p class="v4-description">
        Your complete racing research command centre.
        Analyse saved model forecasts, compare runners,
        inspect race conditions and explore simulations.
      </p>
    `;

    const actions = document.createElement("div");
    actions.className = "v4-header-actions";
    actions.append(
      action("EXPLORE RACES →", "races", true),
      action("LAUNCH SIMULATOR →", "simulator")
    );

    header.append(copy, actions);

    const workspace = document.createElement("div");
    workspace.className = "v4-workspace";

    const main = document.createElement("div");
    main.className = "v4-main";

    const aside = document.createElement("div");
    aside.className = "v4-aside";

    const overview = panel("Performance Overview", "SAVED MODEL");
    const raceCentre = panel("Race Intelligence", "MEETINGS");
    const research = panel("Research Workspace", "ANALYSIS");

    const rankings = panel("Selection Intelligence", "RANKINGS");
    const secondary = panel("Additional Intelligence", "RESEARCH");

    // Reuse the original elements so actual data and actions remain.
    original.forEach(el => {
      if (el.classList.contains("page-head")) {
        research.body.appendChild(el);
      } else if (
        el.classList.contains("kpis") ||
        el.querySelector(".kpis")
      ) {
        overview.body.appendChild(el);
      } else if (
        el.classList.contains("race-grid") ||
        el.classList.contains("three") ||
        el.querySelector(".race-grid") ||
        el.querySelector(".track-card")
      ) {
        raceCentre.body.appendChild(el);
      } else if (
        el.classList.contains("two") ||
        el.querySelector(".mini-race")
      ) {
        rankings.body.appendChild(el);
      } else {
        secondary.body.appendChild(el);
      }
    });

    if (overview.body.children.length) main.append(overview.section);
    if (raceCentre.body.children.length) main.append(raceCentre.section);
    if (research.body.children.length) main.append(research.section);
    if (rankings.body.children.length) aside.append(rankings.section);
    if (secondary.body.children.length) aside.append(secondary.section);

    const quick = panel("Quick Access", "NAVIGATION");

    const links = document.createElement("div");
    links.className = "v4-quicklinks";

    [
      ["DAILY TOP 10", "daily"],
      ["MULTI LAB", "multi"],
      ["COMPARE", "compare"],
      ["TRACK WEATHER", "weather"],
      ["MODEL QUALITY", "quality"],
      ["CALIBRATION", "calibration"]
    ].forEach(([label, page]) => {
      const button = document.createElement("button");
      button.textContent = label + " ↗";
      button.addEventListener("click", () => navigate(page));
      links.appendChild(button);
    });

    quick.body.appendChild(links);
    aside.prepend(quick.section);

    const status = document.createElement("div");
    status.className = "v4-status";

    const dot = document.createElement("span");
    dot.className = "v4-status-dot";

    const message = document.createElement("span");
    message.textContent =
      "Saved research snapshot — verify current conditions";

    status.append(dot, message);
    aside.prepend(status);

    workspace.append(main, aside);

    const strip = screen.querySelector(
      ":scope > .hp3-terminal-strip"
    );

    if (strip) {
      strip.after(header, workspace);
    } else {
      screen.prepend(header, workspace);
    }

    screen.setAttribute("data-v4-home", "true");
  }

  // Observe the original app's page replacements.
  // Schedule at most one rebuild per animation frame.
  let pending = false;

  function schedule() {
    if (pending) return;

    pending = true;

    requestAnimationFrame(() => {
      pending = false;
      build();
    });
  }

  const observer = new MutationObserver(schedule);

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  schedule();
})();

/* RACING LAB — ELITE TRADER V5 */
(() => {
  "use strict";
  if (window.__ELITE_TRADER_V5__) return;
  window.__ELITE_TRADER_V5__ = true;

  const css = document.createElement("style");
  css.textContent = `
    :root {
      --et-bg:#050b11;
      --et-panel:#0b1922;
      --et-border:#23414a;
      --et-green:#35e9a9;
      --et-text:#e9f8f5;
    }

    body,.app,.shell,.page {
      background:var(--et-bg)!important;
    }

    .et-terminal {
      display:flex;
      flex-direction:column;
      gap:12px;
      width:100%;
      min-width:0;
      color:var(--et-text);
    }

    .et-hero {
      display:flex;
      justify-content:space-between;
      gap:18px;
      padding:24px;
      border:1px solid #286c57;
      border-radius:12px;
      background:
        radial-gradient(circle at 85% 0%,
          #15584366,transparent 55%),
        linear-gradient(120deg,#102a30,#07131c);
    }

    .et-eyebrow {
      color:var(--et-green);
      font-size:10px;
      letter-spacing:.2em;
      font-weight:900;
      margin-bottom:9px;
    }

    .et-hero h1 {
      margin:0 0 10px;
      font-size:clamp(28px,4vw,46px);
      letter-spacing:-.05em;
      line-height:1;
      color:white;
    }

    .et-hero p {
      margin:0;
      font-size:12px;
      color:#a6c5c5;
      line-height:1.5;
    }

    .et-status {
      align-self:flex-start;
      padding:9px 12px;
      border-radius:7px;
      border:1px solid #74572d;
      background:#2a2118;
      color:#eac58b;
      font-size:10px;
      font-weight:850;
      white-space:nowrap;
    }

    .et-tabs {
      display:flex;
      gap:5px;
      padding:5px;
      background:#091720;
      border:1px solid var(--et-border);
      border-radius:8px;
      overflow-x:auto;
    }

    .et-tabs button {
      border:0;
      background:transparent;
      color:#a6bfc2;
      border-radius:5px;
      padding:12px 15px;
      white-space:nowrap;
      font-size:11px;
      font-weight:800;
      cursor:pointer;
    }

    .et-tabs button.selected {
      color:white;
      background:#0b624d;
      box-shadow:inset 0 0 0 1px #2be5a5;
    }

    .et-layout {
      display:grid;
      grid-template-columns:
        minmax(0,1.8fr) minmax(270px,.85fr);
      gap:12px;
      align-items:start;
    }

    .et-column {
      display:flex;
      flex-direction:column;
      gap:12px;
      min-width:0;
    }

    .et-panel {
      background:linear-gradient(140deg,#0c2029,#08141d);
      border:1px solid var(--et-border);
      border-radius:9px;
      overflow:hidden;
      min-width:0;
    }

    .et-panel-head {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:13px 15px;
      border-bottom:1px solid var(--et-border);
      background:#0b2529;
    }

    .et-panel-head strong {
      font-size:11px;
      letter-spacing:.09em;
      color:#edfff8;
      text-transform:uppercase;
    }

    .et-panel-head small {
      font-size:9px;
      font-weight:800;
      color:var(--et-green);
    }

    .et-panel-body {
      padding:14px;
      min-width:0;
    }

    .et-panel .tablewrap {
      overflow-x:auto;
      width:100%;
    }

    .et-panel table {
      width:100%;
      border-collapse:collapse;
    }

    .et-panel table th {
      color:#93b1b5!important;
      font-size:10px!important;
      text-transform:uppercase;
      padding:12px 10px!important;
      border-bottom:1px solid #27534a;
    }

    .et-panel table td {
      padding:12px 10px!important;
      border-bottom:1px solid #1b3940!important;
      font-size:12px;
    }

    .et-panel table tbody tr:hover {
      background:#17463855;
    }

    .et-panel .strongnum {
      color:var(--et-green)!important;
    }

    .et-race-selector .race-grid {
      display:grid!important;
      grid-template-columns:
        repeat(auto-fill,minmax(150px,1fr))!important;
      gap:8px!important;
    }

    .et-race-selector .race-tile {
      border-radius:7px!important;
      background:#0c242d!important;
      border:1px solid #27505a!important;
      padding:12px!important;
    }

    .et-race-selector .race-tile.active {
      border-color:var(--et-green)!important;
      background:#123b34!important;
    }

    .et-metrics {
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:8px;
    }

    .et-metric {
      padding:14px;
      border-radius:8px;
      background:#0b232b;
      border:1px solid #25464a;
      min-width:0;
    }

    .et-metric small {
      display:block;
      color:#87a8ad;
      font-size:9px;
      font-weight:850;
      margin-bottom:8px;
    }

    .et-metric strong {
      display:block;
      color:var(--et-green);
      font-size:clamp(16px,2vw,25px);
      font-weight:950;
      overflow-wrap:anywhere;
    }

    .et-metric span {
      display:block;
      color:#91afb3;
      font-size:10px;
      margin-top:6px;
    }

    .et-shortcuts {
      display:grid;
      grid-template-columns:repeat(2,1fr);
      gap:8px;
    }

    .et-shortcuts button {
      padding:15px 10px;
      border-radius:7px;
      border:1px solid #27554e;
      background:#0d2b30;
      color:#e2f9f2;
      font-size:10px;
      font-weight:850;
      text-align:left;
      cursor:pointer;
    }

    .et-shortcuts button:hover {
      border-color:var(--et-green);
    }

    .et-panel-body .grid.two {
      grid-template-columns:1fr!important;
    }

    .et-note {
      padding:13px;
      border-radius:8px;
      border:1px solid #6d522b;
      background:#292016;
      color:#e4c38c;
      font-size:11px;
      line-height:1.6;
    }

    @media(max-width:1050px) {
      .et-layout {
        grid-template-columns:1fr;
      }
    }

    @media(max-width:650px) {
      .et-hero {
        flex-direction:column;
        padding:18px;
      }

      .et-metrics {
        grid-template-columns:repeat(3,minmax(0,1fr));
      }

      .et-metric {
        padding:10px 8px;
      }

      .et-metric strong {
        font-size:16px;
      }

      .et-panel-body {
        padding:10px;
      }
    }
  `;
  document.head.appendChild(css);

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function panel(name, meta) {
    const outer = make("section", "et-panel");
    const head = make("div", "et-panel-head");
    head.append(
      make("strong", "", name),
      make("small", "", meta)
    );
    const body = make("div", "et-panel-body");
    outer.append(head, body);
    return {outer,body};
  }

  function navigate(page) {
    const button = document.querySelector(
      '.sidebar [data-page="' + page + '"]'
    );
    if (button) button.click();
  }

  function metric(name, value, subtitle) {
    const box = make("div", "et-metric");
    box.append(
      make("small", "", name),
      make("strong", "", value),
      make("span", "", subtitle)
    );
    return box;
  }

  function currentPage() {
    return document.querySelector(
      '.sidebar [data-page].active'
    )?.dataset.page;
  }

  function build() {
    const screen = document.getElementById("screen");
    if (!screen || currentPage() !== "races") return;
    if (screen.querySelector(".et-terminal")) return;

    const form = screen.querySelector(":scope > .formrow");
    const grid = screen.querySelector(".race-grid");
    const detail = screen.querySelector(":scope > #race-detail");

    if (!form || !grid || !detail) return;

    const heading = detail.querySelector(
      ":scope > .section-row"
    );
    const cards = detail.querySelector(
      ":scope > .grid.two"
    );

    const remaining = Array.from(detail.children)
      .filter(x => x !== heading && x !== cards);

    const terminal = make("div", "et-terminal");

    const hero = make("header", "et-hero");
    const heroCopy = make("div");
    heroCopy.append(
      make("div","et-eyebrow","RACING LAB / ELITE TRADER"),
      make("h1","","RACE INTELLIGENCE"),
      make("p","",
        "Professional research terminal · V3 model data")
    );
    hero.append(
      heroCopy,
      make("div","et-status","ARCHIVED · NOT LIVE ODDS")
    );

    const tabs = make("nav","et-tabs");
    [
      ["Race Board","races"],
      ["Selections","daily"],
      ["Simulator","simulator"],
      ["Comparisons","compare"],
      ["Weather","weather"],
      ["Model Quality","quality"]
    ].forEach(([label,page]) => {
      const button = make(
        "button",
        page === "races" ? "selected" : "",
        label
      );
      button.type = "button";
      button.addEventListener("click",()=>navigate(page));
      tabs.appendChild(button);
    });

    const layout = make("div","et-layout");
    const left = make("div","et-column");
    const right = make("div","et-column");

    const raceInfo = panel("Selected Race","RACE PROFILE");
    if (heading) raceInfo.body.appendChild(heading);

    const probabilities = panel(
      "Runner Probability Board","V3 FORECAST"
    );

    if (cards) {
      const originalCards = Array.from(cards.children);

      if (originalCards[0]) {
        probabilities.body.appendChild(originalCards[0]);
      }

      if (originalCards[1]) {
        const intelligence = panel(
          "Race Intelligence","MODEL EVIDENCE"
        );
        intelligence.body.appendChild(originalCards[1]);
        right.appendChild(intelligence.outer);
      }

      originalCards.slice(2).forEach(card => {
        const extra = panel("Research","SOURCE DATA");
        extra.body.appendChild(card);
        right.appendChild(extra.outer);
      });
    }

    const selector = panel("Race Selector","ALL RACES");
    selector.outer.classList.add("et-race-selector");
    selector.body.append(form,grid);

    const selected = grid.querySelector(".race-tile.active");
    const raceName =
      selected?.querySelector("h3")?.textContent?.trim()
      || "Select race";
    const leader =
      selected?.querySelector(".leader")?.textContent?.trim()
      || "—";
    const chance =
      selected?.querySelector(".pct")?.textContent?.trim()
      || "—";

    const metrics = make("div","et-metrics");
    metrics.append(
      metric("SELECTED RACE",raceName,"Saved field"),
      metric("MODEL LEADER",leader,"Ranked first"),
      metric("MODEL WIN %",chance,"Uncalibrated")
    );

    const tools = panel("Trading Tools","WORKSPACE");
    const shortcuts = make("div","et-shortcuts");

    [
      ["RACE SIMULATOR","simulator"],
      ["COMPARISONS","compare"],
      ["DAILY RANKINGS","daily"],
      ["TRACK WEATHER","weather"],
      ["QUALITY AUDIT","quality"],
      ["CALIBRATION","calibration"]
    ].forEach(([label,page]) => {
      const button = make("button","",label);
      button.type = "button";
      button.addEventListener("click",()=>navigate(page));
      shortcuts.appendChild(button);
    });

    tools.body.appendChild(shortcuts);

    const research = panel(
      "Extended Form & Research","ORIGINAL DATA"
    );
    remaining.forEach(node => research.body.appendChild(node));

    left.append(
      raceInfo.outer,
      metrics,
      probabilities.outer,
      research.outer
    );

    right.prepend(
      selector.outer,
      tools.outer,
      make(
        "div",
        "et-note",
        "Saved V3 research snapshot. Probabilities " +
        "are provisional and uncalibrated. " +
        "Live market odds and current scratchings " +
        "are not verified."
      )
    );

    layout.append(left,right);
    terminal.append(hero,tabs,layout);

    const oldHeading = screen.querySelector(
      ":scope > .page-head"
    );
    if (oldHeading) oldHeading.remove();

    screen.prepend(terminal);
  }

  let pending = false;

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      try {
        build();
      } catch (error) {
        console.error("Elite Trader V5:",error);
      }
    });
  }

  new MutationObserver(schedule).observe(
    document.body,
    {childList:true,subtree:true}
  );

  schedule();
})();

/* RACING LAB — FORECAST INTEGRITY V1
   Read-only: does not change model predictions.
*/
(function () {
  "use strict";

  if (window.RacingLabIntegrity) return;

  function audit(records, races, options = {}) {
    const grouped = new Map();

    for (const horse of Array.isArray(records) ? records : []) {
      if (!horse || typeof horse.race !== "string") continue;

      if (!grouped.has(horse.race)) {
        grouped.set(horse.race, []);
      }

      grouped.get(horse.race).push(horse);
    }

    const raceIds = new Set([
      ...grouped.keys(),
      ...(Array.isArray(races) ? races : [])
        .map(r => r.id)
        .filter(Boolean)
    ]);

    return [...raceIds].map(id => {
      const field = grouped.get(id) || [];
      const issues = [];
      const names = new Set();
      let total = 0;

      for (const horse of field) {
        const name = String(horse.name || "").trim();

        if (!name) {
          issues.push("Missing runner name");
        }

        if (names.has(name)) {
          issues.push("Duplicate runner: " + name);
        }

        names.add(name);

        if (
          typeof horse.p !== "number" ||
          !Number.isFinite(horse.p) ||
          horse.p < 0 ||
          horse.p > 100
        ) {
          issues.push("Invalid probability: " + name);
        } else {
          total += horse.p;
        }
      }

      if (field.length < 2) {
        issues.push("Insufficient runner forecasts");
      }

      if (Math.abs(total - 100) >= 0.16) {
        issues.push("Field total differs from 100%");
      }

      const race = (Array.isArray(races) ? races : [])
        .find(r => r.id === id);

      if (
        race &&
        Number.isFinite(Number(race.n)) &&
        Number(race.n) > field.length
      ) {
        issues.push(
          "Missing runner forecasts: " +
          (Number(race.n) - field.length)
        );
      }

      return {
        race: id,
        model: options.model || "V3-H3-S3 provisional",
        date: options.date || null,
        scenario: "archived-base",
        runners: field.length,
        total: Math.round(total * 10000) / 10000,
        complete: issues.length === 0,
        issues: [...new Set(issues)]
      };
    });
  }

  window.RacingLabIntegrity = Object.freeze({ audit });

  function getAppData() {
    try {
      return Function(
        "return typeof DATA !== 'undefined' ? DATA : null"
      )();
    } catch {
      return null;
    }
  }

  function getAppRaces() {
    try {
      return Function(
        "return typeof getRaces === 'function' ? getRaces() : []"
      )();
    } catch {
      return [];
    }
  }

  function paint() {
    const screen = document.getElementById("screen");
    if (!screen) return;

    const activePage = document.querySelector(
      '.navbtn.active[data-page]'
    );

    if (activePage?.dataset.page !== "quality") return;

    if (screen.querySelector("[data-integrity-report]")) return;

    const data = getAppData();

    if (!data || !Array.isArray(data.records)) return;

    const rows = audit(
      data.records,
      getAppRaces(),
      { date: data.date }
    );

    const flagged = rows.filter(r => !r.complete);

    const section = document.createElement("section");
    section.className = "card section-space";
    section.dataset.integrityReport = "true";

    const heading = document.createElement("h2");
    heading.textContent = "Forecast Integrity";
    section.appendChild(heading);

    const summary = document.createElement("p");
    summary.textContent =
      rows.length + " races checked · " +
      flagged.length + " flagged · " +
      "Archived base forecast · Read-only";

    section.appendChild(summary);

    for (const race of flagged) {
      const line = document.createElement("p");

      line.textContent =
        race.race + " · " +
        race.total.toFixed(2) + "% · " +
        race.issues.join("; ");

      section.appendChild(line);
    }

    if (flagged.length === 0) {
      const success = document.createElement("p");
      success.textContent =
        "No structural issues detected. " +
        "Predictive accuracy and calibration remain unverified.";

      section.appendChild(success);
    }

    screen.appendChild(section);
  }

  let scheduled = false;

  function schedule() {
    if (scheduled) return;
    scheduled = true;

    queueMicrotask(() => {
      scheduled = false;
      paint();
    });
  }

  new MutationObserver(schedule).observe(
    document.body,
    { childList: true, subtree: true }
  );

  schedule();
})();

/* RACING LAB — HYBRID ULTIMATE V1 | additive interface, no model mutations */
(()=>{'use strict';
if(window.__RL_HYBRID_ULTIMATE__)return;
window.__RL_HYBRID_ULTIMATE__=true;
const css=`
/* Hybrid Ultimate: mobile-first density and consistent hierarchy */
:root{--hu-accent:#39e9ad;--hu-ink:#e9faf6;--hu-muted:#96b6ba}
#screen .hu-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;background:linear-gradient(110deg,#102d32,#091720);border:1px solid #296359;border-radius:12px;margin-bottom:12px}
#screen .hu-brand{font-size:10px;letter-spacing:.15em;color:var(--hu-accent);font-weight:900}
#screen .hu-title{font-size:clamp(18px,3vw,25px);font-weight:900;line-height:1.2;color:white;margin:3px 0}
#screen .hu-meta{font-size:11px;color:var(--hu-muted)}
#screen .hu-actions{display:flex;gap:7px;flex-shrink:0}
#screen .hu-btn{background:#14343a;border:1px solid #31615e;border-radius:8px;color:#e9faf6;padding:10px 12px;font-weight:800;font-size:11px;cursor:pointer}
#screen .hu-btn.primary{background:#106e55;border-color:#2cd99e;color:white}
#screen .hu-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px}
#screen .hu-stat{min-width:0;padding:12px;background:#10262e;border:1px solid #24454d;border-radius:10px}
#screen .hu-stat small{display:block;font-size:9px;letter-spacing:.06em;color:#98b9bc;font-weight:800;margin-bottom:6px}
#screen .hu-stat strong{display:block;font-size:clamp(13px,2.2vw,19px);line-height:1.2;color:#39e9ad;overflow-wrap:anywhere}
#screen .hu-stat span{display:block;font-size:10px;color:#8caab0;margin-top:5px}
#screen .hu-board{background:#0b1d26;border:1px solid #2a4d54;border-radius:12px;padding:14px;margin-bottom:12px}
#screen .hu-board-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:12px}
#screen .hu-board-head b{color:white;font-size:14px}
#screen .hu-board-head small{font-size:10px;color:#39e9ad;text-align:right}
#screen .hu-runner{display:grid;grid-template-columns:24px minmax(0,1fr) 72px;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #1c3941}
#screen .hu-rank{color:#91afb5;font-size:12px}
#screen .hu-name{font-size:12px;color:#ecf8f5;font-weight:750;overflow-wrap:anywhere}
#screen .hu-track{height:5px;background:#203b43;border-radius:10px;overflow:hidden;margin-top:7px}
#screen .hu-fill{height:100%;background:linear-gradient(90deg,#148e77,#40e7ae);border-radius:10px}
#screen .hu-pct{text-align:right;color:#3ce9b0;font-size:13px;font-weight:900;font-variant-numeric:tabular-nums}
#screen .hu-foot{font-size:10px;color:#a0b9bc;line-height:1.5;margin-top:10px}
#screen .hu-shortcuts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px}
#screen .hu-shortcuts button{background:#10352f;border:1px solid #276b57;border-radius:9px;color:#d9fff0;padding:12px 6px;font-size:11px;font-weight:850;cursor:pointer}
#screen .hu-selector{background:#0d232b;border:1px solid #2a4d54;border-radius:12px;padding:12px;margin-bottom:12px}
#screen .hu-selector label{display:block;color:#a8c3c5;font-size:10px;font-weight:800;margin-bottom:6px}
#screen .hu-selector select{width:100%;min-width:0;background:#0a1820;color:#e8faf5;border:1px solid #2b5659;border-radius:7px;padding:10px;font-size:13px}
#screen .hu-quant{border:1px solid #4c485b;background:#171d2a;border-radius:11px;padding:13px;margin:12px 0}
#screen .hu-quant h3{color:#e9edff;margin:0 0 8px;font-size:14px}
#screen .hu-quant p{color:#adb7c8;margin:5px 0;font-size:11px;line-height:1.5}
#screen .hu-quant strong{color:#d2b9ff}
#screen .hu-original{margin-top:12px}
#screen .hu-original>summary{cursor:pointer;background:#102932;color:#c5f6e5;padding:13px;border:1px solid #2a5457;border-radius:9px;font-size:12px;font-weight:800}
#screen .hu-original[open]>summary{margin-bottom:12px}
#screen .hu-original .et-panel,#screen .hu-original .et-panel-body{min-width:0}
#screen .hu-original .tablewrap{overflow-x:auto;max-width:100%}
#screen .hu-original table{min-width:580px}
#screen .hu-hide{display:none!important}
@media(max-width:800px){
 #screen .et-terminal{gap:10px}
 #screen .et-hero{display:none!important}
 #screen .et-tabs{display:none!important}
 #screen .et-layout{display:flex!important;flex-direction:column!important;gap:10px!important}
 #screen .et-column{width:100%!important;min-width:0!important}
 #screen .et-metrics{display:none!important}
 #screen .et-column>.et-panel{min-width:0}
 #screen .hu-summary{gap:6px}
 #screen .hu-stat{padding:9px}
 #screen .hu-stat strong{font-size:12px}
 #screen .hu-shortcuts button{font-size:10px}
 #screen .hu-bar{padding:12px}
 #screen .hu-btn{padding:9px}
 #screen .hu-original .et-panel-head{padding:10px}
 #screen .hu-original .et-panel-body{padding:9px}
}
`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const nav=page=>document.querySelector('.sidebar [data-page="'+page+'"]')?.click();
const data=()=>window.RacingLabApp?.data||window.DATA||null;
const races=()=>window.RacingLabApp?.getRaces?.()||window.getRaces?.()||[];
const raceId=()=>document.querySelector('[data-change="race-jump"]')?.value||null;
const modelField=id=>(data()?.records||[]).filter(h=>h.race===id&&Number.isFinite(h.p)).sort((a,b)=>b.p-a.p);
function activate(){
 const screen=document.getElementById('screen');
 if(!screen||!screen.querySelector('.et-terminal')||screen.querySelector('.hu-bar'))return;
 const terminal=screen.querySelector('.et-terminal');
 const id=raceId();const race=races().find(r=>r.id===id);const f=modelField(id);const total=f.reduce((a,h)=>a+h.p,0);
 const ok=f.length>1&&Math.abs(total-100)<.16;
 const base=data();const date=base?.date||'Unknown';
 const bar=make('section','hu-bar');const left=make('div');left.append(make('div','hu-brand','RACING LAB / HYBRID ULTIMATE'),make('div','hu-title',id?String(id).replace('_R',' · R').replaceAll('_',' '):'Race Centre'),make('div','hu-meta',(race?.distance||'—')+'m · '+date+' · Archived model'));
 const acts=make('div','hu-actions');const prev=make('button','hu-btn','◀');const next=make('button','hu-btn primary','Next ▶');
 const ids=races().map(r=>r.id);const pos=ids.indexOf(id);
 for(const [b,step] of [[prev,-1],[next,1]]){b.type='button';b.onclick=()=>{const target=ids[(pos+step+ids.length)%ids.length];const jump=document.querySelector('[data-change="race-jump"]');if(jump&&target){jump.value=target;jump.dispatchEvent(new Event('change',{bubbles:true}))}}}
 acts.append(prev,next);bar.append(left,acts);
 const selector=make('div','hu-selector');const label=make('label','','Jump to race');const select=make('select');
 for(const r of races()){const opt=document.createElement('option');opt.value=r.id;opt.textContent=r.id.replace('_R',' · R').replaceAll('_',' ')+(r.name?' — '+r.name:'');opt.selected=r.id===id;select.append(opt)}
 select.onchange=()=>{const jump=document.querySelector('[data-change="race-jump"]');if(jump){jump.value=select.value;jump.dispatchEvent(new Event('change',{bubbles:true}))}};selector.append(label,select);
 const summary=make('div','hu-summary');
 for(const [label,value,note] of [['MODEL LEADER',f[0]?.name||'—','Archived ranking'],['WIN SHARE',f[0]?f[0].p.toFixed(2)+'%':'—','Uncalibrated'],['FIELD TOTAL',total.toFixed(2)+'%',ok?'Mathematical check':'Review required']]){const card=make('div','hu-stat');card.append(make('small','',label),make('strong','',value),make('span','',note));summary.append(card)}
 const board=make('section','hu-board');const head=make('div','hu-board-head');head.append(make('b','','Runner probability board'),make('small','',ok?'ARCHIVED BASE · 100%':'INCOMPLETE · REVIEW'));board.append(head);
 const max=Math.max(1,...f.map(h=>h.p));
 f.forEach((h,i)=>{const row=make('div','hu-runner');const center=make('div');center.append(make('div','hu-name',h.name||'Unnamed runner'));const track=make('div','hu-track');const fill=make('div','hu-fill');fill.style.width=Math.max(0,Math.min(100,100*h.p/max))+'%';track.append(fill);center.append(track);row.append(make('span','hu-rank',String(i+1)),center,make('span','hu-pct',h.p.toFixed(2)+'%'));board.append(row)});
 if(!f.length)board.append(make('p','hu-foot','No archived runner forecasts found for this race.'));
 board.append(make('p','hu-foot','Base model snapshot only. Scratch-adjusted and Friday revisions may differ. These figures are not calibrated win probabilities or live market odds.'));
 const shortcuts=make('div','hu-shortcuts');for(const [name,page] of [['Simulator','simulator'],['Top 10','daily'],['Quant / Quality','quality']]){const b=make('button','',name);b.type='button';b.onclick=()=>nav(page);shortcuts.append(b)}
 const quant=make('section','hu-quant');quant.append(make('h3','','Quant research / forecast integrity'),make('p','','Snapshot: '+date+' · '+f.length+' saved runners · '+(ok?'Field total validated':'Field incomplete or invalid')));
 quant.append(make('p','','Structural validation is not predictive calibration. Compare model accuracy only after verified historical results are imported.'));
 const original=make('details','hu-original');const sum=make('summary','','Full original analysis, form & race tools');original.append(sum);
 // Move existing V5 layout, preserving event listeners, data and simulator links.
 const layout=terminal.querySelector('.et-layout');if(layout)original.append(layout);
 const tabs=terminal.querySelector('.et-tabs');if(tabs)tabs.classList.add('hu-hide');
 const hero=terminal.querySelector('.et-hero');if(hero)hero.classList.add('hu-hide');
 terminal.prepend(bar,selector,summary,board,shortcuts,quant,original);
 // Keep original controls available inside expanded research; no forecast changes.
}
let pending=false;function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;try{activate()}catch(e){console.error('Hybrid Ultimate:',e)}})}
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});schedule();
})();

/* RACING LAB — TOP 3 CONTENDER INTELLIGENCE V1 */
(() => {
  "use strict";

  if (window.__RL_TOP3_INTELLIGENCE__) return;
  window.__RL_TOP3_INTELLIGENCE__ = true;

  const style = document.createElement("style");
  style.textContent = `
    #screen .hu-board > .hu-runner,
    #screen .hu-board > .hu-foot {
      display: none !important;
    }

    #screen .ri-card {
      background: #11232c;
      border: 1px solid #31515a;
      border-radius: 14px;
      padding: 15px;
      margin: 12px 0;
      color: #dce9eb;
    }

    #screen .ri-head {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
    }

    #screen .ri-head b {
      color: white;
      font-size: 17px;
    }

    #screen .ri-pct {
      color: #5be5bd;
      font-weight: 800;
      font-size: 22px;
      white-space: nowrap;
    }

    #screen .ri-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 12px;
    }

    #screen .ri-note {
      background: #1a3039;
      padding: 11px;
      border-radius: 9px;
      font-size: 13px;
      line-height: 1.5;
    }

    #screen .ri-note strong {
      display: block;
      color: white;
      margin-bottom: 4px;
    }

    #screen .ri-all summary {
      color: #5be5bd;
      cursor: pointer;
      padding: 12px 0;
      font-weight: 700;
    }

    #screen .ri-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #31515a;
      padding: 7px 0;
      font-size: 13px;
    }

    #screen .ri-muted {
      color: #9fb5ba;
      font-size: 12px;
      line-height: 1.5;
    }

    @media (max-width: 480px) {
      #screen .ri-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);

  function make(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) {
      element.textContent = content;
    }
    return element;
  }

  function render() {
    const board = document.querySelector("#screen .hu-board");

    if (!board || board.querySelector(".ri-root")) return;

    const raceId = document.querySelector(
      '[data-change="race-jump"]'
    )?.value;

    const data = window.RacingLabApp?.data || window.DATA;

    const field = (data?.records || [])
      .filter(h => h.race === raceId && Number.isFinite(h.p))
      .sort((a, b) => b.p - a.p);

    if (!field.length) return;

    const root = make("div", "ri-root");

    root.appendChild(
      make("h3", "", "TOP 3 CONTENDERS · RACE INTELLIGENCE")
    );

    const overview = make("section", "ri-card");
    overview.appendChild(
      make("b", "", "Race Map & Scenario Analysis")
    );

    const overviewGrid = make("div", "ri-grid");

    const overviewItems = [
      [
        "Model leader",
        field[0].name + " · " + field[0].p.toFixed(2) + "%"
      ],
      [
        "Separation",
        field.length > 1
          ? (field[0].p - field[1].p).toFixed(2) +
            " percentage points"
          : "Unavailable"
      ],
      [
        "Likely pace",
        "Unverified. Speed maps and previous settling " +
        "positions are needed for a reliable projection."
      ],
      [
        "What changes the rankings?",
        "Scratchings, tempo, barriers, track bias and " +
        "new form evidence could change the outcome."
      ]
    ];

    overviewItems.forEach(([heading, body]) => {
      const note = make("div", "ri-note");
      note.appendChild(make("strong", "", heading));
      note.appendChild(make("span", "", body));
      overviewGrid.appendChild(note);
    });

    overview.appendChild(overviewGrid);
    root.appendChild(overview);

    field.slice(0, 3).forEach((horse, index) => {
      const card = make("article", "ri-card");
      const header = make("div", "ri-head");
      const name = make("div", "");

      const rankLabel = [
        "#1 · MODEL LEADER",
        "#2 · MAIN DANGER",
        "#3 · THIRD CONTENDER"
      ][index];

      name.appendChild(make("small", "", rankLabel));
      name.appendChild(document.createElement("br"));
      name.appendChild(make("b", "", horse.name));

      header.appendChild(name);
      header.appendChild(
        make("div", "ri-pct", horse.p.toFixed(2) + "%")
      );

      card.appendChild(header);

      const grid = make("div", "ri-grid");

      const positives =
        "Ranked #" + (index + 1) +
        " by the saved forecasting model." +
        (Number.isFinite(horse.barrier)
          ? " Recorded barrier: " + horse.barrier + "."
          : "") +
        " Specific form strengths require verified evidence.";

      const negatives = index === 0
        ? "The rest of the field collectively holds " +
          (100 - horse.p).toFixed(2) +
          "% of the saved probability. The leader is not a certainty."
        : "Higher-ranked rivals have stronger model forecasts. " +
          "Specific weaknesses still require form verification.";

      const notes = [
        ["✓ Positives", positives],
        ["! Risks & negatives", negatives],
        [
          "Winning run & pace scenario",
          "A horse-specific winning run cannot be reliably " +
          "projected until its running style, early speed and " +
          "sectional history are verified."
        ],
        [
          "Why this percentage?",
          "Saved model probability: " +
          horse.p.toFixed(2) + "%." +
          (Number.isFinite(horse.rating)
            ? " Model rating: " + horse.rating + "."
            : "") +
          " Detailed factor contributions are not yet available."
        ]
      ];

      notes.forEach(([heading, body]) => {
        const note = make("div", "ri-note");
        note.appendChild(make("strong", "", heading));
        note.appendChild(make("span", "", body));
        grid.appendChild(note);
      });

      card.appendChild(grid);
      root.appendChild(card);
    });

    const fullField = make("details", "ri-all");

    fullField.appendChild(
      make(
        "summary",
        "",
        "View full field · " + field.length + " runners"
      )
    );

    field.forEach((horse, index) => {
      const row = make("div", "ri-row");

      row.appendChild(
        make("span", "", (index + 1) + ". " + horse.name)
      );

      row.appendChild(
        make("b", "", horse.p.toFixed(2) + "%")
      );

      fullField.appendChild(row);
    });

    root.appendChild(fullField);

    const total = field.reduce(
      (sum, horse) => sum + horse.p,
      0
    );

    root.appendChild(
      make(
        "p",
        "ri-muted",
        "Archived forecast · Field total " +
        total.toFixed(2) +
        "%. Original simulator and stored forecasts are unchanged."
      )
    );

    board.appendChild(root);
  }

  let scheduled = false;

  new MutationObserver(() => {
    if (scheduled) return;

    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;

      try {
        render();
      } catch (error) {
        console.error("Racing Lab Top 3:", error);
      }
    });
  }).observe(document.body, {
    childList: true,
    subtree: true
  });

  render();
})();
