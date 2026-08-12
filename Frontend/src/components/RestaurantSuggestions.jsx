import { useEffect, useState } from "react";
import { getAccount, getNearbyPlaces } from "../services/api";

function RestaurantSuggestions({ transactions }) {

  const [restaurants, setRestaurants] = useState([]);
  const [budget, setBudget] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    let mounted = true;

    const loadRestaurants = async () => {

      try {

        setLoading(true);

        // ------------------------------------
        // GET REAL UPI ACCOUNT BALANCE
        // ------------------------------------

        const account = await getAccount();

        const currentBalance =
          Number(account?.balance) || 0;


        // ------------------------------------
        // CALCULATE MONTHLY EXPENSES
        // ------------------------------------

        const now = new Date();

        const month = now.getMonth();
        const year = now.getFullYear();

        const monthlyExpense = transactions
          .filter(t => {
            const date = new Date(t.date);

            return (
              Number(t.amount) < 0 &&
              date.getMonth() === month &&
              date.getFullYear() === year
            );
          })
          .reduce(
            (total, t) =>
              total + Math.abs(Number(t.amount)),
            0
          );


        // ------------------------------------
        // KEEP 10% AS EMERGENCY RESERVE
        // ------------------------------------

        const emergencyReserve =
          currentBalance * 0.10;

        const availableAfterReserve =
          Math.max(
            currentBalance - emergencyReserve,
            0
          );


        // ------------------------------------
        // FOOD BUDGET
        // 30% OF AVAILABLE MONEY
        // ------------------------------------

        const foodBudget =
          availableAfterReserve * 0.30;

        setBudget(foodBudget);


        if (foodBudget <= 0) {

          if (mounted) {
            setRestaurants([]);
            setLoading(false);
          }

          return;
        }


        // ------------------------------------
        // GET USER LOCATION
        // ------------------------------------

        navigator.geolocation.getCurrentPosition(

          async (position) => {

            if (!mounted) return;

            const lat =
              position.coords.latitude;

            const lng =
              position.coords.longitude;


            try {

              // --------------------------------
              // CALL OUR BACKEND
              // --------------------------------

              const data =
                await getNearbyPlaces({
                  budget: Math.floor(foodBudget),
                  category: "all",
                  lat,
                  lng
                });


              if (!mounted) return;


              const places =
                Array.isArray(data?.places)
                  ? data.places
                  : [];


              // --------------------------------
              // SORT BY BEST VALUE
              // --------------------------------

              const sortedPlaces = [...places]
                .sort((a, b) => {

                  const costA =
                    Number(a.estimatedCost) || 0;

                  const costB =
                    Number(b.estimatedCost) || 0;

                  return costA - costB;
                });


              setRestaurants(
                sortedPlaces.slice(0, 5)
              );


            } catch (error) {

              console.error(
                "Nearby places error:",
                error
              );

              if (mounted) {
                setRestaurants([]);
              }

            } finally {

              if (mounted) {
                setLoading(false);
              }

            }

          },

          (error) => {

            console.error(
              "Location error:",
              error
            );

            if (mounted) {
              setRestaurants([]);
              setLoading(false);
            }

          },

          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }

        );


      } catch (error) {

        console.error(
          "Failed to load account:",
          error
        );

        if (mounted) {
          setRestaurants([]);
          setLoading(false);
        }

      }

    };


    loadRestaurants();


    return () => {
      mounted = false;
    };

  }, [transactions]);


  // ------------------------------------
  // GOOGLE MAPS
  // ------------------------------------

  const openMaps = (restaurant) => {

    const query = encodeURIComponent(
      `${restaurant.name || "restaurant"} near me`
    );

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      "_blank"
    );
  };


  // ------------------------------------
  // VIEW MENU
  // ------------------------------------

  const openMenu = (restaurant) => {

    const query = encodeURIComponent(
      `${restaurant.name || "restaurant"} menu`
    );

    window.open(
      `https://www.google.com/search?q=${query}`,
      "_blank"
    );
  };


  return (

    <>

      {/* -------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------- */}

      {!loading && restaurants.length > 0 && (

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12
          }}
        >

          <div>

            <div
              style={{
                fontSize: 12,
                color: "var(--muted)"
              }}
            >
              Smart food budget
            </div>

            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 18,
                fontWeight: 700
              }}
            >
              ₹{Math.floor(budget)}
            </div>

          </div>

          <div
            style={{
              fontSize: 11,
              padding: "5px 10px",
              borderRadius: 20,
              background: "var(--green-soft)",
              color: "var(--green)"
            }}
          >
            Within budget
          </div>

        </div>

      )}


      {/* -------------------------------- */}
      {/* LOADING */}
      {/* -------------------------------- */}

      {loading ? (

        <div className="empty-state">

          <p>
            🔎 Finding places within your budget...
          </p>

        </div>


      ) : restaurants.length === 0 ? (

        <div className="empty-state">

          <p>
            No restaurants within budget nearby. Time to cook? 🍳
          </p>

        </div>


      ) : (

        <div className="restaurant-grid">

          {restaurants.map((r, i) => (

            <div
              key={r.id || i}
              className="res-card-modern"
            >

              <div className="res-info">

                {/* NAME */}

                <h4>
                  {r.name || "Local Restaurant"}
                </h4>


                {/* META */}

                <div className="res-meta">

                  <span className="dist-tag">
                    📍 {r.distance || "Nearby"}
                  </span>

                  <span className="cost-tag">
                    ₹{r.estimatedCost || 0} avg
                  </span>

                </div>


                {/* CUISINE */}

                {r.cuisine && (

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: "var(--muted)"
                    }}
                  >
                    🍴 {r.cuisine}
                  </div>

                )}


                {/* RATING */}

                {r.rating && (

                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 11
                    }}
                  >
                    ⭐ {r.rating}
                  </div>

                )}


                {/* BUDGET STATUS */}

                {r.estimatedCost && (

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      color:
                        Number(r.estimatedCost) <= budget
                          ? "var(--green)"
                          : "var(--ember)"
                    }}
                  >

                    {Number(r.estimatedCost) <= budget
                      ? "✓ Fits your budget"
                      : "Over budget"}

                  </div>

                )}

              </div>


              {/* ACTIONS */}

              <div
                className="res-action"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6
                }}
              >

                <button
                  className="view-btn"
                  onClick={() => openMenu(r)}
                >
                  View Menu
                </button>


                <button
                  className="view-btn"
                  onClick={() => openMaps(r)}
                  style={{
                    opacity: 0.85
                  }}
                >
                  📍 Directions
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

    </>

  );

}

export default RestaurantSuggestions;