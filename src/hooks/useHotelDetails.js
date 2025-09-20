"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/utils/api";

const uniq = (a) => Array.from(new Set((a || []).filter(Boolean)));
const stripHtml = (html) => {
  if (!html) return "";
  try {
    const cleaned = String(html)
      .replace(/^<!\[CDATA\[|\]\]>$/g, "")
      .replace(/<br\s*\/?>/gi, "\n");
    if (typeof window !== "undefined") {
      const div = document.createElement("div");
      div.innerHTML = cleaned;
      return div.textContent || div.innerText || "";
    }
    return cleaned.replace(/<[^>]+>/g, "");
  } catch {
    return "";
  }
};
const parseFacilities = (html) =>
  uniq(stripHtml(html || "").split(/\n+/).map((x) => x.trim()).filter(Boolean));

function unwrapResponse(res) {
  if (res && typeof res === "object" && "data" in res && res.data !== undefined) {
    return res.data;
  }
  return res;
}
function extractHotelNode(raw) {
  if (!raw) return null;
  if (raw.hotel) return raw.hotel;
  if (raw.data?.hotel) return raw.data.hotel;
  if (raw.result?.hotel) return raw.result.hotel;
  if (raw.payload?.hotel) return raw.payload.hotel;
  if (typeof raw === "object" && (raw.hotelId || raw.name || raw.offers)) return raw;
  return null;
}

/** helper: pull hotels list from general search payloads of various shapes */
function extractHotelsList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw.hotels)) return raw.hotels;
  if (Array.isArray(raw.data?.hotels)) return raw.data.hotels;
  if (Array.isArray(raw.result?.hotels)) return raw.result.hotels;
  if (Array.isArray(raw.payload?.hotels)) return raw.payload.hotels;
  return [];
}

export function useHotelDetails({
  id,
  arrivalDate,
  nights = 1,
  rooms = 1,
  adults = 2,
  children = 0,
  cityCode,
  childrenAges = "",
  filterBasis = "",
  maxOffers = 8,
  maximumWaitTime = 15,
}) {
  const hotelId = String(id ?? "").trim();

  const [loading, setLoading] = useState(true);

  // Card/top section
  const [hotel, setHotel] = useState(null);
  const [offersPreview, setOffersPreview] = useState([]);

  // Media & info
  const [heroPhotos, setHeroPhotos] = useState([]);
  const [totalPhotoCount, setTotalPhotoCount] = useState(0);
  const [fullAddress, setFullAddress] = useState("");
  const [areaLabel, setAreaLabel] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [facilities, setFacilities] = useState([]);
  const [distances, setDistances] = useState([]);

  // avoid race/strict mode overwrites
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!hotelId || !cityCode || !arrivalDate || !nights) return;

    const myReqId = ++reqIdRef.current;
    let alive = true;
    setLoading(true);

    // clear UI while loading this hotel (prevents bleed from previous hotel)
    setOffersPreview([]);
    setHeroPhotos([]);
    setTotalPhotoCount(0);
    setFullAddress("");
    setAreaLabel("");
    setAboutText("");
    setFacilities([]);
    setDistances([]);

    // placeholder, որ header-ը չդատարկվի
    setHotel({
      _id: String(hotelId),
      name: "",
      stars: 0,
      location: { city: null, country: null, address: null, lat: null, lng: null },
      // ⚠️ չդնենք offers: [] հիմա, որ չգրի ոչնչով չեկած երկրորդ պատասխանով
    });

    const qsAvail = new URLSearchParams({
      cityId: String(cityCode),
      hotelId: String(hotelId),
      arrivalDate: String(arrivalDate),
      nights: String(nights),
      rooms: String(rooms),
      adults: String(adults),
      children: String(children),
      childrenAges: String(childrenAges || ""),
      ...(filterBasis ? { filterBasis: String(filterBasis) } : {}),
      maxOffers: String(maxOffers),
      maximumWaitTime: String(maximumWaitTime),
    }).toString();

    // --- primary: hotel-availability
    const fetchAvail = async () => {
      const res = await api.get(`/suppliers/goglobal/hotel-availability?${qsAvail}`);
      const raw = unwrapResponse(res);
      const node = extractHotelNode(raw);

      console.log("[HD] AVAIL raw type:", typeof raw, "keys:", raw && Object.keys(raw));
      console.log("[HD] AVAIL node type:", typeof node, "keys:", node && Object.keys(node));
      const found = Boolean(raw?.meta?.found ?? true);

      if (!node) return { found: false, offers: [], normalizedHotel: null, firstImage: null };

      const normalizedHotel = {
        _id: String(hotelId),
        name: node.name || "",
        stars: Number(node.category || 0),
        location: {
          city: node.city ?? null,
          country: node.country ?? null,
          address: node.address ?? null,
          lat: node?.location?.lat ?? null,
          lng: node?.location?.lng ?? null,
        },
      };

      const firstImage =
        node.image ||
        (Array.isArray(node.images) ? (node.images[0]?.url || node.images[0]) : null) ||
        null;

      return {
        found,
        normalizedHotel,
        offers: Array.isArray(node.offers) ? node.offers : [],
        firstImage,
      };
    };

    // --- fallback: city availability (filter by this hotel)
    const fetchAvailFallback = async () => {
      try {
        const qs = new URLSearchParams({
          cityId: String(cityCode),
          arrivalDate: String(arrivalDate),
          nights: String(nights),
          rooms: String(rooms),
          adults: String(adults),
          children: String(children),
          childrenAges: String(childrenAges || ""),
          maxHotels: "200",
          maxOffers: String(Math.max(5, maxOffers)),
          includeInfo: "0",
          infoLimit: "0",
        }).toString();

        const res = await api.get(`/suppliers/goglobal/availability?${qs}`);
        const raw = unwrapResponse(res);
        const hotels = extractHotelsList(raw);

        const foundHotel =
          hotels.find((h) => String(h?._id || h?.hotelCode || h?.hotelId) === hotelId) || null;

        if (!foundHotel) {
          console.log("[HD] Fallback: hotel not found in city search");
          return { offers: [], normalizedHotel: null, firstImage: null, fallback: true };
        }

        const normalizedHotel = {
          _id: String(hotelId),
          name: foundHotel?.name || "",
          stars: Number(foundHotel?.category || foundHotel?.stars || 0),
          location: {
            city: foundHotel?.location?.city ?? null,
            country: foundHotel?.location?.country ?? null,
            address: foundHotel?.location?.address ?? null,
            lat: foundHotel?.location?.lat ?? null,
            lng: foundHotel?.location?.lng ?? null,
          },
        };

        const offers = Array.isArray(foundHotel?.offersPreview) ? foundHotel.offersPreview.map((o) => ({
          price: o?.price ? { ...o.price } : { amount: Number(o?.amount || 0), currency: o?.currency || "USD" },
          board: o?.board || "",
          refundable: o?.refundable,
          cxlDeadline: o?.cxlDeadline || null,
          cancellation: o?.cancellation || null,
          searchCode: o?.searchCode || null,
          category: Number(o?.category || 0),
          roomName: o?.roomName || "Room",
          remarksHtml: o?.remarksHtml || "",
          preferred: Boolean(o?.preferred),
          offerProof: o?.offerProof || null,
        })) : [];

        const firstImage =
          foundHotel?.thumbnail ||
          (Array.isArray(foundHotel?.images) ? (foundHotel.images[0]?.url || foundHotel.images[0]) : null) ||
          null;

        console.log("[HD] Fallback used. offers:", offers.length);
        return { offers, normalizedHotel, firstImage, fallback: true };
      } catch (e) {
        console.warn("[HD] Fallback error", e);
        return { offers: [], normalizedHotel: null, firstImage: null, fallback: true };
      }
    };

    // --- hotel-info
    const fetchInfo = async () => {
      const res = await api.get(`/suppliers/goglobal/hotel-info?hotelId=${encodeURIComponent(hotelId)}`);
      const raw = unwrapResponse(res);
      const node = extractHotelNode(raw);

      console.log("[HD] INFO raw type:", typeof raw, "keys:", raw && Object.keys(raw));
      console.log("[HD] INFO node type:", typeof node, "keys:", node && Object.keys(node));

      if (!node) {
        return {
          name: "",
          category: 0,
          address: "",
          descriptionHtml: "",
          facilitiesHtml: "",
          distances: [],
          pictures: [],
        };
      }

      const pictures = uniq((node?.pictures || node?.images || []).map((p) => p?.url || p?.URL || p));
      return {
        name: node?.name || "",
        category: Number(node?.category || 0),
        address: node?.address || "",
        descriptionHtml: node?.descriptionHtml || node?.description || "",
        facilitiesHtml: node?.facilitiesHtml || "",
        distances: Array.isArray(node?.distances) ? node.distances : [],
        pictures,
      };
    };

    (async () => {
      try {
        // first try dedicated availability
        const [a, i] = await Promise.allSettled([fetchAvail(), fetchInfo()]);
        const aVal = a.status === "fulfilled" ? a.value : null;
        const iVal = i.status === "fulfilled" ? i.value : null;

        console.log("[HD] avail:", !!aVal, "offers:", aVal?.offers?.length || 0, aVal);
        console.log("[HD] info:", iVal || {}, "pics:", iVal?.pictures?.length || 0);

        if (!alive || myReqId !== reqIdRef.current) return;

        // if dedicated availability came empty/not found → fallback once via city availability
        let finalAvail = aVal;
        if ((aVal?.offers?.length ?? 0) === 0 || aVal?.found === false) {
          const fb = await fetchAvailFallback();
          if (fb && (fb.offers?.length ?? 0) > 0) {
            finalAvail = fb;
          }
        }

        // availability → card + offers + fallback image
        if (finalAvail) {
          const { normalizedHotel, offers, firstImage } = finalAvail;

          // do not overwrite with empty strings/nulls
          if (normalizedHotel) {
            setHotel((prev) => {
              const base =
                prev ||
                {
                  _id: String(hotelId),
                  name: "",
                  stars: 0,
                  location: { city: null, country: null, address: null, lat: null, lng: null },
                };
              return {
                ...base,
                name: base.name || normalizedHotel.name || "",
                stars: base.stars || Number(normalizedHotel.stars || 0),
                location: {
                  ...(base.location || {}),
                  city: base.location?.city || normalizedHotel.location?.city || null,
                  country: base.location?.country || normalizedHotel.location?.country || null,
                  address: base.location?.address || normalizedHotel.location?.address || null,
                  lat: base.location?.lat ?? normalizedHotel.location?.lat ?? null,
                  lng: base.location?.lng ?? normalizedHotel.location?.lng ?? null,
                },
                // ✅ write offers onto hotel for UI
                ...(Array.isArray(offers) && offers.length ? { offers } : {}),
              };
            });
          }

          if (Array.isArray(offers)) {
            // keep existing non-empty if new is empty (prevents flicker/overwrite with found:false)
            if (offers.length) setOffersPreview(offers);
          }

          if (firstImage) {
            setHeroPhotos([firstImage]);
            setTotalPhotoCount(1);
          }
        }

        // info → enrich + pictures override
        if (iVal) {
          const { name, category, address, descriptionHtml, facilitiesHtml, distances, pictures } = iVal;

          if (address) setFullAddress(address);
          if (descriptionHtml) setAboutText(stripHtml(descriptionHtml));
          const fac = parseFacilities(facilitiesHtml);
          if (fac.length) setFacilities(fac);
          if (Array.isArray(distances) && distances.length) setDistances(distances);

          if (pictures.length) {
            setHeroPhotos(pictures.slice(0, 5));
            setTotalPhotoCount(pictures.length);
          }

          setHotel((prev) => {
            const base =
              prev ||
              {
                _id: String(hotelId),
                name: "",
                stars: 0,
                location: { city: null, country: null, address: null, lat: null, lng: null },
              };
            return {
              ...base,
              name: base.name || name || "",
              stars: base.stars || Number(category || 0),
              location: {
                ...(base.location || {}),
                address: base.location?.address || address || null,
              },
            };
          });

          setAreaLabel((curr) => (curr ? curr : address || ""));
        }

        if (!finalAvail && !iVal) {
          setHotel({
            _id: String(hotelId),
            name: "",
            stars: 0,
            location: { city: null, country: null, address: null, lat: null, lng: null },
          });
        }
      } catch (e) {
        console.warn("[useHotelDetails] error", e);
        setHotel((h) => h || {
          _id: String(hotelId),
          name: "",
          stars: 0,
          location: { city: null, country: null, address: null, lat: null, lng: null },
        });
        // leave offersPreview as-is (avoid wiping a previously good set)
      } finally {
        if (alive && myReqId === reqIdRef.current) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hotelId,
    cityCode,
    arrivalDate,
    nights,
    rooms,
    adults,
    children,
    childrenAges,
    filterBasis,
    maxOffers,
    maximumWaitTime,
  ]);

  // ապագայում եթե պետք լինի minOffer–ից cutoff–ներ
  const cutoffs = useMemo(() => {
    const o = null;
    const plat = o?.platformCutoffUtc || o?.platform?.cutoffUtc || null;
    const supp = o?.supplierDeadlineUtc || o?.supplier?.deadlineUtc || null;
    return { plat, supp };
  }, []);

  return {
    loading,
    hotel,            // ✅ հիմա hotel.offers կլինի, երբ հայթայթվի
    offersPreview,    // թողնում ենք, եթե ցանկանում ես ուղղակի pass անես view-ին
    heroPhotos,
    totalPhotoCount,
    fullAddress,
    areaLabel,
    aboutText,
    facilities,
    distances,
    cutoffs,
  };
}