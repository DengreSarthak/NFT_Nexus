"use client";

import mapboxgl from "mapbox-gl";
import { useRef, useEffect } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { Token, Crate, User } from "@/types/types";
import {
  createCrateMarker,
  createPlayerMarker,
  createTokenMarker,
  createUserMarker,
} from "@/utlis/markers";

interface MapComponentProps {
  tokens: Token[];
  crates: Crate[];
  users: User[];
  currentUser: User;
  onTokenClick?: (token: Token) => void;
  onUserClick?: (user: User) => void;
}

export default function MapComponent({
  tokens,
  crates,
  users,
  currentUser,
  onTokenClick,
  onUserClick,
}: MapComponentProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const currentUserMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const userMarkersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const tokenMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const crateMarkersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
      console.error("Mapbox token is required");
      return;
    }

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current!,
        zoom: 18,
        pitch: 60,
        bearing: 0,
        attributionControl: false,
        projection: "globe",
        logoPosition: "top-left",
      });

      // Create current user marker with click handler
      const currentUserElement = createPlayerMarker(currentUser);
      if (onUserClick) {
        currentUserElement.addEventListener("click", () =>
          onUserClick(currentUser)
        );
      }

      currentUserMarkerRef.current = new mapboxgl.Marker({
        element: currentUserElement,
        anchor: "center",
      });

      // Create markers for other users with click handlers
      users.forEach((user) => {
        if (user.id !== currentUser.id) {
          const userElement = createUserMarker(user);
          if (onUserClick) {
            userElement.addEventListener("click", () => onUserClick(user));
          }

          const marker = new mapboxgl.Marker({
            element: userElement,
            anchor: "center",
          })
            .setLngLat([user.longitude, user.latitude])
            .addTo(mapRef.current!);

          userMarkersRef.current[user.id] = marker;
        }
      });

      // Create token markers with click handlers
      tokens.forEach((token) => {
        const tokenElement = createTokenMarker(token);
        if (onTokenClick) {
          tokenElement.addEventListener("click", () => onTokenClick(token));
        }

        const marker = new mapboxgl.Marker({
          element: tokenElement,
          anchor: "center",
        })
          .setLngLat([token.longitude, token.latitude])
          .addTo(mapRef.current!);

        tokenMarkersRef.current.push(marker);
      });

      // Create crate markers
      crates.forEach((crate) => {
        const marker = new mapboxgl.Marker({
          element: createCrateMarker(),
          anchor: "center",
        })
          .setLngLat([crate.longitude, crate.latitude])
          .setPopup(
            new mapboxgl.Popup({
              closeOnMove: true,
              className: "text-black",
            }).setHTML(`<h3>hoho</h3>`)
          )
          .addTo(mapRef.current!);

        crateMarkersRef.current.push(marker);
      });
    }

    // Get and watch current user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [longitude, latitude];

          mapRef.current?.flyTo({
            center: newLocation,
            zoom: 16,
            essential: true,
          });

          currentUserMarkerRef.current
            ?.setLngLat(newLocation)
            .addTo(mapRef.current!);
        },
        (error) => console.error("Error getting location:", error)
      );

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [longitude, latitude];

          if (currentUserMarkerRef.current) {
            currentUserMarkerRef.current.setLngLat(newLocation);
          }

          mapRef.current?.easeTo({
            center: newLocation,
            duration: 1000,
          });
        },
        (error) => console.error("Error watching position:", error),
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 5000,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        currentUserMarkerRef.current?.remove();
        Object.values(userMarkersRef.current).forEach((marker) =>
          marker.remove()
        );
        userMarkersRef.current = {};
        tokenMarkersRef.current.forEach((marker) => marker.remove());
        tokenMarkersRef.current = [];
        crateMarkersRef.current.forEach((marker) => marker.remove());
        crateMarkersRef.current = [];
      };
    }
  }, [tokens, crates, users, currentUser, onTokenClick, onUserClick]);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <style jsx global>{`
        .mapboxgl-control-container {
          display: none !important;
        }
        .mapboxgl-canvas {
          cursor: default !important;
        }
      `}</style>
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </main>
  );
}