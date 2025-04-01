class SideTopTopNavigation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }); // Shadow DOM
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const drawerToggle = this.shadowRoot.querySelector("#sidebar-toggle");
    const dismissButton = this.shadowRoot.querySelector("#dismiss-button");
    const sidebar = this.shadowRoot.querySelector(".primary-sidebar");

    if (drawerToggle) {
      drawerToggle.addEventListener("click", () => {
        sidebar.classList.toggle("drawer-open");
      });
    }

    if (dismissButton) {
      dismissButton.addEventListener("click", () => {
        sidebar.classList.remove("drawer-open");
      });
    }
  }

  render() {
    const primaryTopbarColor =
      this.getAttribute("primary-topbar-color") || "rgb(85, 85, 85)";
    const secondaryTopbarColor =
      this.getAttribute("secondary-topbar-color") || "rgb(133, 133, 133)";

    const primaryTopbarUsed =
      this.querySelector('[slot="primary-topbar"]') !== null;
    const secondaryTopbarUsed =
      this.querySelector('[slot="secondary-topbar"]') !== null;

    const primaryTopbarClass = primaryTopbarUsed ? "" : "hidden";
    const secondaryTopbarClass = secondaryTopbarUsed ? "" : "hidden";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary-topbar-height: 5rem;
          --secondary-topbar-height: 3rem;
          --primary-sidebar-width: 20rem;
        }

        .primary-topbar {
          background-color: ${primaryTopbarColor};
          width: 100vw;
          height: var(--primary-topbar-height);
          position: fixed;
          z-index: 1001;
          top: 0;
          left: 0;

        }

        .secondary-topbar {
          background-color: ${secondaryTopbarColor};
          top: var(--primary-topbar-height);
          left: var(--primary-sidebar-width);
          height: var(--secondary-topbar-height);
          width: calc(100vw - var(--primary-sidebar-width));
          position: fixed;
          z-index: 1001;
          overflow: auto;
        }

        .primary-sidebar {
          background-color: rgba(54, 54, 54, 100);
          top: var(--primary-topbar-height);
          height: calc(100% - var(--primary-topbar-height));
          width: var(--primary-sidebar-width);
          left: 0;
          position: fixed;
          z-index: 1001;
          transition: transform 0.3s ease-in-out;
        }



        .main-content-toolbar {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          transform: translateX(calc(-1 / 2 * var(--primary-sidebar-width)));
          margin-left: calc(var(--primary-sidebar-width) + 1rem);
          margin-top: calc(var(--primary-topbar-height) + var(--secondary-topbar-height) + 1rem);
        }

        p, span {
          max-width: 70ch;
        }

        .hidden {
          display: none;
        }
        #dismiss-button {
          display: none;
        }
        #sidebar-toggle {
          display: none;
          position: absolute;
        }
        @media (max-width: 1400px) {
          .main-content-toolbar {
            transform: none;
          }
        }

        @media (max-width: 576px) {
          .primary-sidebar{
            top: 0;
            height: 100vh;
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
            <button id="sidebar-toggle">☰</button>

            <slot name="primary-topbar" class="${primaryTopbarClass}"></slot>

            </div>
          <div class="secondary-topbar ${secondaryTopbarClass}">
          <button id="dismiss-button" style="display: none;">✖</button>

            <slot name="secondary-topbar"></slot>
          </div>
          <div class="primary-sidebar">
            <slot name="sidebar"></slot>
          </div>
        </div>
      </header>
      <main class="main-content-toolbar">
        <slot name="content"></slot>
      </main>
    `;
  }
}

customElements.define("side-top-top-navigation", SideTopTopNavigation);
