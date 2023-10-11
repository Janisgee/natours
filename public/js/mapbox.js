export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiamFuaXNnZWUiLCJhIjoiY2xuYWYycnZ1MDNzeDJwdGp4NW1mZmgxdCJ9.cTjbFsr4bMq1u9BeBlryfw';

  let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/janisgee/clnafdq1v00a201r7cktdalro',
    scrollZoom: false,
    doubleClickZoom: false,
    maxZoom: 11,
    // center: [-118.278046, 34.051789],
    // zoom: 6,
    // interactive: false,
  });

  //Create Bound
  const bounds = new mapboxgl.LngLatBounds();

  //Loop every tour location
  locations.forEach((loc) => {
    //Create popup Sign
    const popup = new mapboxgl.Popup({
      offset: 15,
      focusAfterOpen: false,
      closeOnClick: false,
      closeButton: false,
    }).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`);

    //Create marker
    const el = document.createElement('div');
    el.className = 'marker';
    const marker = new mapboxgl.Marker({
      element: el,
    })
      .setLngLat(loc.coordinates)
      .addTo(map)
      .setPopup(popup);

    //pop up appear when toggle
    marker.togglePopup();
    //Extend map bound to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 150, left: 200, right: 200 },
  });
};
