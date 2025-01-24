import { Token } from "@/types/types";
import NexusLogo from "@/assets/nexuslogo.png"; // Import Nexus logo

const createMarkerElement = (className: string, content: string) => {
  const el = document.createElement("div");
  el.className = className;
  el.innerHTML = content;

  // Add fixed size styling for all markers
  el.style.width = "120px";
  el.style.height = "120px";
  el.style.borderRadius = "50%"; // Make it circular
  el.style.overflow = "hidden";

  return el;
};

const createTokenMarker = (token: Token) =>
  createMarkerElement(
    "token-marker",
    `
      <div class="token-outer">
        <img src="${NexusLogo.src}" alt="${token.symbol}" class="marker-image" style="width: 100%; height: 100%;" />
      </div>
    `
  );

export { createTokenMarker };
