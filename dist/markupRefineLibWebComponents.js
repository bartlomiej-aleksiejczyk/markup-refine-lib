class p extends HTMLElement {
  constructor() {
    super(), this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.render(), this.setupEventListeners();
  }
  setupEventListeners() {
    const o = this.shadowRoot.querySelector("#sidebar-toggle"), e = this.shadowRoot.querySelector("#dismiss-button"), r = this.shadowRoot.querySelector(".primary-sidebar"), t = this.shadowRoot.querySelector(".overlay");
    o && r && t && o.addEventListener("click", () => {
      r.classList.toggle("drawer-open"), t.classList.add("visible"), document.body.style.overflowY = "hidden";
    }), e && r && t && e.addEventListener("click", () => {
      r.classList.remove("drawer-open"), t.classList.remove("visible"), document.body.style.overflowY = "visible";
    }), t && r && t.addEventListener("click", () => {
      r.classList.remove("drawer-open"), t.classList.remove("visible"), document.body.style.overflowY = "visible";
    });
  }
  render() {
    const o = document.documentElement, e = getComputedStyle(o), r = this.getAttribute("primary-topbar-color") || e.getPropertyValue("--color-secondary-darker").trim() || "hsl(0, 0%, 71%)", t = this.getAttribute("secondary-topbar-color") || e.getPropertyValue("--color-secondary-lighter").trim() || "hsl(0, 0%, 94%)", a = this.getAttribute("primary-sidebar-color") || e.getPropertyValue("--color-secondary").trim() || "hsl(0, 0%, 87%)", i = this.getAttribute("icon-color") || e.getPropertyValue("--color-text-secondary").trim() || "hsl(0, 0%, 33%)", s = this.getAttribute("icon-color-highlight") || e.getPropertyValue("--color-text-primary").trim() || "hsl(0, 0%, 20%)", n = this.querySelector('[slot="primary-topbar"]') !== null, l = this.querySelector('[slot="secondary-topbar"]') !== null, d = n ? "" : "hidden", c = l ? "" : "hidden";
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary-topbar-height: 5rem;
          --secondary-topbar-height: 3rem;
          --primary-sidebar-width: 20rem;
          --icon-color: #${i};
        }

        .primary-topbar {
          background-color: ${r};
          width: 100vw;
          height: var(--primary-topbar-height);
          position: fixed;
          z-index: 1001;
          top: 0;
          left: 0;

        }

        .secondary-topbar {
          background-color: ${t};
          top: var(--primary-topbar-height);
          left: var(--primary-sidebar-width);
          height: var(--secondary-topbar-height);
          width: calc(100vw - var(--primary-sidebar-width));
          position: fixed;
          z-index: 1001;
          overflow: auto;
        }

        .primary-sidebar {
          background-color: ${a};
          top: var(--primary-topbar-height);
          height: calc(100% - var(--primary-topbar-height));
          width: var(--primary-sidebar-width);
          left: 0;
          position: fixed;
          z-index: 1003;
        }

        .main-content-toolbar {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          transform: translateX(calc(-1 / 2 * var(--primary-sidebar-width)));
          margin-left: calc(var(--primary-sidebar-width) + 1rem);
        }

        p, span {
          max-width: 70ch;
        }

        .hidden {
          display: none;
        }
        .button {
          width: 3.25rem;
          height: 3.25rem;
          display: flex;
          background-color: transparent;
          border: none;
          justify-content: center;
          align-items: center;        
        }
        .button svg path {
          fill: ${i};
          transition: fill 0.3s ease;
        }

        .button:hover svg path {
          fill: ${s};
        }

        #dismiss-button {
          display: none;
          margin-right: .75rem;
          margin-top: .75rem;
          position: absolute;
          right: 0;
        }

        #sidebar-toggle {
          display: none;
          position: absolute;
          top: calc((var(--primary-topbar-height) - 3.25rem) / 2);
          left: 0.75rem;
        }
        .overlay {
        display: none;
        }
        .overlay.visible {
          display: block;
          position: fixed;
          overflow-y: hidden;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.3);
          z-index: 1002;
        }
        @media (max-width: 1400px) {
          .main-content-toolbar {
            transform: none;
          }
        }

        @media (max-width: 768px) {
          .primary-sidebar{
            transition: transform 0.3s ease-in-out;
            height: 100vh;
            top: 0;
          }
          .primary-sidebar.drawer-open {
          transform: translateX(0);
        }

        .primary-sidebar:not(.drawer-open) {
          transform: translateX(-100%);
        }
        .secondary-topbar {
          left: 0;
          width: 100vw;
        }
        .primary-sidebar.drawer-open {
          transform: translateX(0);
        }
        .primary-sidebar:not(.drawer-open) {
          transform: translateX(-100%);
        }
        #dismiss-button {
          display: block;
        }
        #sidebar-toggle {
          display: block;
        }
        }
      </style>

      <header>
        <div id="toolbars-container">
          <div class="primary-topbar">
            <button id="sidebar-toggle" class="button">
            <!--
            Material Icons used under the Apache License, Version 2.0
            http://www.apache.org/licenses/LICENSE-2.0
            -->
              <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" ><path d="M120-240v-66.67h720V-240H120Zm0-206.67v-66.66h720v66.66H120Zm0-206.66V-720h720v66.67H120Z"/></svg>            
            </button>
            <slot name="primary-topbar" class="${d}"></slot>

            </div>
          <div class="secondary-topbar ${c}">

            <slot name="secondary-topbar"></slot>
          </div>
          <div class="primary-sidebar">
            <button id="dismiss-button" class="button">
              <!--
              Material Icons used under the Apache License, Version 2.0
              http://www.apache.org/licenses/LICENSE-2.0
              -->
              <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px"><path d="m251.33-204.67-46.66-46.66L433.33-480 204.67-708.67l46.66-46.66L480-526.67l228.67-228.66 46.66 46.66L526.67-480l228.66 228.67-46.66 46.66L480-433.33 251.33-204.67Z"/>
              </svg>
            </button>
            <slot name="sidebar"></slot>
          </div>
          <div class="overlay"></div>

        </div>
      </header>
      <main class="main-content-toolbar">
        <slot name="content"></slot>
      </main>
    `;
  }
}
customElements.define("side-top-top-navigation", p);
