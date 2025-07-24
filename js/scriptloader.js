const domain = "https://resources.newportpolo.com";

const loadScript = (url) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url + getDecacheString();
    document.getElementsByTagName("head")[0].appendChild(script);
};

const loadStyle = (url) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url + getDecacheString();
    document.getElementsByTagName("head")[0].appendChild(link);
};

const getDecacheString = (url) => {
    return "?" + (Math.floor(Math.random() * 100000000) + 1).toString();
}

loadScript(domain + "/js/polomatch.js");
loadStyle(domain + "/css/polomatch.css");
