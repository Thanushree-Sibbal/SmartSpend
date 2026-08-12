const express = require("express");
const auth = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// OVERPASS SERVERS
// ========================================

const OVERPASS_SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter"
];


// ========================================
// DISTANCE CALCULATION
// ========================================

function calculateDistance(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat =
        (lat2 - lat1) * Math.PI / 180;

    const dLon =
        (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +

        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}


// ========================================
// ESTIMATE COST
// ========================================

function estimateCost(tags) {

    const amenity = tags.amenity || "";

    const cuisine =
        (tags.cuisine || "").toLowerCase();


    if (
        amenity === "fast_food" ||
        cuisine.includes("burger") ||
        cuisine.includes("pizza")
    ) {
        return 200;
    }


    if (amenity === "cafe") {
        return 250;
    }


    if (
        cuisine.includes("indian") ||
        cuisine.includes("south_indian") ||
        cuisine.includes("north_indian")
    ) {
        return 300;
    }


    if (
        cuisine.includes("continental") ||
        cuisine.includes("italian") ||
        cuisine.includes("japanese") ||
        cuisine.includes("korean")
    ) {
        return 600;
    }


    return 400;
}


// ========================================
// GET REAL NEARBY PLACES
// ========================================

router.get("/", auth, async (req, res) => {

    try {

        const budget =
            Number(req.query.budget) || 0;

        const category =
            req.query.category || "all";

        const latitude =
            Number(req.query.lat);

        const longitude =
            Number(req.query.lng);


        // ------------------------------------
        // VALIDATE LOCATION
        // ------------------------------------

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {

            return res.status(400).json({
                message:
                    "Valid latitude and longitude are required"
            });

        }


        // ------------------------------------
        // CATEGORY FILTER
        // ------------------------------------

        let amenityFilter =
            '["amenity"~"restaurant|cafe|fast_food"]';


        if (category === "restaurant") {

            amenityFilter =
                '["amenity"="restaurant"]';

        }


        if (category === "cafe") {

            amenityFilter =
                '["amenity"="cafe"]';

        }


        if (category === "fast_food") {

            amenityFilter =
                '["amenity"="fast_food"]';

        }


        // ------------------------------------
        // OVERPASS QUERY
        // ------------------------------------

        const query = `
[out:json][timeout:20];

nwr
  ${amenityFilter}
  (around:5000,${latitude},${longitude});

out center tags;
`;


        // ------------------------------------
        // TRY MULTIPLE SERVERS
        // ------------------------------------

        let data = null;
        let lastError = null;

        for (const server of OVERPASS_SERVERS) {

            try {

                console.log(
                    `Trying Overpass server: ${server}`
                );


                const response = await fetch(
                    server,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/x-www-form-urlencoded",

                            "User-Agent":
                                "SmartSpender/1.0"
                        },

                        body:
                            new URLSearchParams({
                                data: query
                            }),

                        signal:
                            AbortSignal.timeout(25000)
                    }
                );


                if (!response.ok) {

                    const errorText =
                        await response.text();

                    console.log(
                        `Overpass ${response.status}:`,
                        errorText.slice(0, 200)
                    );

                    lastError =
                        new Error(
                            `Overpass returned ${response.status}`
                        );

                    continue;

                }


                data =
                    await response.json();


                console.log(
                    `Overpass success: ${server}`
                );

                break;


            } catch (error) {

                console.error(
                    `Overpass server failed: ${server}`,
                    error.message
                );

                lastError = error;

            }

        }


        // ------------------------------------
        // ALL SERVERS FAILED
        // ------------------------------------

        if (!data) {

            return res.status(502).json({

                message:
                    "Nearby places service temporarily unavailable",

                error:
                    lastError?.message || "Unknown error"

            });

        }


        // ------------------------------------
        // CONVERT OSM RESULTS
        // ------------------------------------

        let places =
            (data.elements || [])
                .map(place => {

                    const tags =
                        place.tags || {};


                    const placeLat =
                        place.lat ??
                        place.center?.lat;

                    const placeLng =
                        place.lon ??
                        place.center?.lon;


                    if (
                        placeLat === undefined ||
                        placeLng === undefined
                    ) {
                        return null;
                    }


                    const distance =
                        calculateDistance(
                            latitude,
                            longitude,
                            placeLat,
                            placeLng
                        );


                    const estimatedCost =
                        estimateCost(tags);


                    let placeCategory =
                        "restaurant";


                    if (
                        tags.amenity === "cafe"
                    ) {

                        placeCategory = "cafe";

                    }


                    if (
                        tags.amenity === "fast_food"
                    ) {

                        placeCategory =
                            "fast_food";

                    }


                    return {

                        id:
                            `${place.type}-${place.id}`,

                        name:
                            tags.name ||
                            "Unnamed place",

                        category:
                            placeCategory,

                        cuisine:
                            tags.cuisine ||
                            "Local cuisine",

                        estimatedCost,

                        distance:
                            `${distance.toFixed(1)} km`,

                        distanceKm:
                            distance,

                        rating:
                            null,

                        address:
                            [
                                tags["addr:housenumber"],
                                tags["addr:street"],
                                tags["addr:city"]
                            ]
                                .filter(Boolean)
                                .join(", "),

                        website:
                            tags.website ||
                            null,

                        latitude:
                            placeLat,

                        longitude:
                            placeLng,

                        source:
                            "OpenStreetMap"

                    };

                })
                .filter(Boolean);


        // ------------------------------------
        // REMOVE DUPLICATES
        // ------------------------------------

        const seen = new Set();

        places =
            places.filter(place => {

                const key =
                    place.name.toLowerCase();

                if (seen.has(key)) {
                    return false;
                }

                seen.add(key);

                return true;

            });


        // ------------------------------------
        // BUDGET FILTER
        // ------------------------------------

        if (budget > 0) {

            places =
                places.filter(
                    place =>
                        place.estimatedCost <= budget
                );

        }


        // ------------------------------------
        // SORT BY DISTANCE
        // ------------------------------------

        places.sort(
            (a, b) =>
                a.distanceKm -
                b.distanceKm
        );


        // ------------------------------------
        // LIMIT RESULTS
        // ------------------------------------

        places =
            places.slice(0, 20);


        // ------------------------------------
        // RESPONSE
        // ------------------------------------

        res.json({

            budget,

            location: {
                latitude,
                longitude
            },

            count:
                places.length,

            places

        });


    } catch (error) {

        console.error(
            "Places fetch error:",
            error
        );

        res.status(500).json({

            message:
                "Failed to fetch nearby places",

            error:
                error.message

        });

    }

});


module.exports = router;