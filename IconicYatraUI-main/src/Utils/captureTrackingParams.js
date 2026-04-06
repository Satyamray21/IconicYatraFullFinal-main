export const captureTrackingParams = () => {
  const params = new URLSearchParams(window.location.search);

  const trackingData = {
    gclid: params.get("gclid"),
    fbclid: params.get("fbclid"),
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_term: params.get("utm_term"),
    utm_content: params.get("utm_content"),
    landingPage: window.location.href,
    device: navigator.userAgent,
  };

  localStorage.setItem("trackingData", JSON.stringify(trackingData));
};
