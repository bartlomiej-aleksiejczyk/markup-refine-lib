class l extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.render(),this.setupEventListeners()}setupEventListeners(){const e=this.shadowRoot.querySelector("#sidebar-toggle"),o=this.shadowRoot.querySelector("#dismiss-button"),r=this.shadowRoot.querySelector(".primary-sidebar"),t=this.shadowRoot.querySelector(".overlay");e&&r&&t&&e.addEventListener("click",()=>{r.classList.toggle("drawer-open"),t.classList.add("visible"),document.body.style.overflowY="hidden"}),o&&r&&t&&o.addEventListener("click",()=>{r.classList.remove("drawer-open"),t.classList.remove("visible"),document.body.style.overflowY="visible"}),t&&r&&t.addEventListener("click",()=>{r.classList.remove("drawer-open"),t.classList.remove("visible"),document.body.style.overflowY="visible"})}render(){const e=this.getAttribute("primary-topbar-color")||"rgb(85, 85, 85)",o=this.getAttribute("secondary-topbar-color")||"rgb(133, 133, 133)",r=this.getAttribute("primary-sidebar-color")||"rgb(54, 54, 54)",t=this.getAttribute("icon-color")||"rgb(211, 211, 211)",i=this.getAttribute("icon-color-highlight")||"rgb(255, 255, 255)",a=this.querySelector('[slot="primary-topbar"]')!==null,s=this.querySelector('[slot="secondary-topbar"]')!==null,n=a?"":"hidden",d=s?"":"hidden";this.shadowRoot.innerHTML=`
      <style>
        :host {
          --primary-topbar-height: 5rem;
          --secondary-topbar-height: 3rem;
          --primary-sidebar-width: 20rem;
          --icon-color: #${t};
        }

        .primary-topbar {
          background-color: ${e};
          width: 100vw;
          height: var(--primary-topbar-height);
          position: fixed;
          z-index: 1001;
          top: 0;
          left: 0;

        }

        .secondary-topbar {
          background-color: ${o};
          top: var(--primary-topbar-height);
          left: var(--primary-sidebar-width);
          height: var(--secondary-topbar-height);
          width: calc(100vw - var(--primary-sidebar-width));
          position: fixed;
          z-index: 1001;
          overflow: auto;
        }

        .primary-sidebar {
          background-color: ${r};
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
          fill: ${t};
          transition: fill 0.3s ease;
        }

        .button:hover svg path {
          fill: ${i};
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
            <slot name="primary-topbar" class="${n}"></slot>

            </div>
          <div class="secondary-topbar ${d}">

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
    `}}customElements.define("side-top-top-navigation",l);
