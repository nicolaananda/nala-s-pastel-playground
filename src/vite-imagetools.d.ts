/// <reference types="vite/client" />

declare module '*?w=*&format=webp' {
  const src: string;
  export default src;
}

declare module '*?format=webp' {
  const src: string;
  export default src;
}

declare module '*?w=*' {
  const src: string;
  export default src;
}

// For vite-imagetools
declare module '*.jpg?w=*&format=webp' {
  const src: string;
  export default src;
}

declare module '*.png?w=*&format=webp' {
  const src: string;
  export default src;
}

declare module '*.jpeg?w=*&format=webp' {
  const src: string;
  export default src;
}

