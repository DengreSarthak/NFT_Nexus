"use client";

import mapboxgl from "mapbox-gl";
import { useRef, useEffect } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { Token, User } from "@/types/types";
import { createTokenMarker } from "@/utlis/markers";

interface MapComponentProps {
  tokens: Token[];
  currentUser: User;
  onTokenClick?: (token: Token) => void;
}

export default function MapComponent({
  tokens,
  currentUser,
  onTokenClick,
}: MapComponentProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const tokenMarkersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
      console.error("Mapbox token is required");
      return;
    }

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!mapRef.current) {
      // Initialize Mapbox
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [currentUser.longitude, currentUser.latitude],
        zoom: 15,
      });

      // Add the current user's location marker
      const userMarker = new mapboxgl.Marker({
        color: "#FF0000", // Red for current user
      })
        .setLngLat([currentUser.longitude, currentUser.latitude])
        .addTo(mapRef.current!);

      // Add token markers
      tokens.forEach((token) => {
        const tokenElement = createTokenMarker(token);

        // Attach click event if provided
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
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      tokenMarkersRef.current.forEach((marker) => marker.remove());
      tokenMarkersRef.current = [];
    };
  }, [tokens, currentUser, onTokenClick]);

  return (
    <div className="relative w-full h-screen">
      <style jsx global>{`
        .mapboxgl-marker {
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10;
        }
      `}</style>
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
