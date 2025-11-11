import Link from "next/link";

export const ArrowDropdownIcon = ({className}: {className?:string}) => 
    <svg width="15" height="9" className={className} viewBox="0 0 15 9" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 1.35669L7.5 9L0 1.35669L1.33125 0L7.5 6.28662L13.6688 0L15 1.35669Z" fill="black"/>
</svg>


export const FacebookSVG = () => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12.06C22 6.477 17.523 2 11.94 2 6.357 2 1.88 6.477 1.88 12.06c0 4.998 3.657 9.144 8.438 9.94v-7.03H7.898v-2.91h2.42V9.845c0-2.39 1.423-3.71 3.6-3.71 1.043 0 2.134.187 2.134.187v2.35h-1.202c-1.186 0-1.556.737-1.556 1.492v1.79h2.648l-.423 2.91h-2.225V22c4.78-.796 8.428-4.942 8.428-9.94z" />
    </svg>
  );
}

export const  InstagramSVG = () => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.5a5.5 5.5 0 1 1 0 11.001A5.5 5.5 0 0 1 12 7.5zm0 2a3.5 3.5 0 1 0 .001 6.999A3.5 3.5 0 0 0 12 9.5zm5.25-2.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
    </svg>
  );
}

export const  LinkedInSVG = () => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5zM3 9h3.96v12H3zM14.5 9c-2.21 0-3.5 1.2-4.08 2.29V9H6.5v12h3.92v-6.47c0-1.71.33-3.36 2.44-3.36 2.07 0 2.1 1.94 2.1 3.47V21H19v-6.89C19 10.63 17.43 9 14.5 9z" />
    </svg>
  );
}

export const YouTubeSVG = () => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 7.2a3 3 0 0 0-2.11-2.12C19.7 4.5 12 4.5 12 4.5s-7.7 0-9.39.58A3 3 0 0 0 .5 7.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.11 2.12C4.3 19.5 12 19.5 12 19.5s7.7 0 9.39-.58A3 3 0 0 0 23.5 16.8 31 31 0 0 0 24 12a31 31 0 0 0-.5-4.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

export const  TwitterSVG = () => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 5.8c-.7.3-1.4.5-2.1.6.8-.5 1.3-1.2 1.6-2.1-.7.4-1.6.8-2.4.9a3.6 3.6 0 0 0-6.4 2.5c0 .3 0 .6.1.8-3-.1-5.7-1.6-7.5-3.9a3.6 3.6 0 0 0 .5 4.7c-.6 0-1.2-.2-1.7-.5v.1c0 1.8 1.3 3.4 3 3.7-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.5 1.9 2.6 3.6 2.6a7.2 7.2 0 0 1-5.3 1.5 10.2 10.2 0 0 0 5.6 1.6c6.7 0 10.3-5.6 10.3-10.4v-.5c.7-.5 1.3-1.1 1.8-1.8z" />
    </svg>
  );
}


export const  AppStoreBadge = ()  =>{
  return (
    <Link
      href="#"
      aria-label="Download on the App Store"
      className="inline-flex"
    >
      <svg
        width="140"
        height="40"
        viewBox="0 0 140 40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="140" height="40" rx="8" fill="black" />
        <text
          x="16"
          y="24"
          fontFamily="ui-sans-serif, system-ui"
          fontSize="10"
          fill="white"
        >
          Download on the
        </text>
        <text
          x="16"
          y="34"
          fontFamily="ui-sans-serif, system-ui"
          fontWeight="700"
          fontSize="14"
          fill="white"
        >
          App Store
        </text>
        <circle cx="10" cy="20" r="6" fill="white" />
      </svg>
    </Link>
  );
}

export const  PlayStoreBadge = ()  => {
  return (
    <Link href="#" aria-label="Get it on Google Play" className="inline-flex">
      <svg
        width="160"
        height="40"
        viewBox="0 0 160 40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="160" height="40" rx="8" fill="black" />
        <text
          x="18"
          y="24"
          fontFamily="ui-sans-serif, system-ui"
          fontSize="10"
          fill="white"
        >
          GET IT ON
        </text>
        <text
          x="18"
          y="34"
          fontFamily="ui-sans-serif, system-ui"
          fontWeight="700"
          fontSize="14"
          fill="white"
        >
          Google Play
        </text>
        <polygon points="10,20 22,12 22,28" fill="white" />
      </svg>
    </Link>
  );
}
