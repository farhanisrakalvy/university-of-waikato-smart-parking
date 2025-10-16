// MapComponent.tsx - Mobile version (with maps)
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { Navigation } from 'lucide-react-native';

interface Spot {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  created_by: string | null;
  created_at: string;
}

interface MapComponentProps {
  spots?: Spot[];
  mapRegion?: Region;
  onRegionChange?: (region: Region) => void;
  onSpotPress?: (spot: Spot) => void;
  onLocationPress?: () => void;
  onSwitchToList?: () => void;
  selectedSpotId?: string | null;
  style: any;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  spots = [],
  mapRegion,
  onRegionChange = () => {},
  onSpotPress = () => {},
  onLocationPress = () => {},
  selectedSpotId = null,
  style
}) => {
  return (
    <View style={style}>
      <MapView
        style={{ flex: 1 }}
        region={mapRegion}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
      >
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{
              latitude: spot.latitude,
              longitude: spot.longitude,
            }}
            title={spot.title}
            description={spot.description}
            onPress={() => onSpotPress(spot)}
          >
            <View
              style={{
                width: selectedSpotId === spot.id ? 36 : 30,
                height: selectedSpotId === spot.id ? 36 : 30,
                borderRadius: selectedSpotId === spot.id ? 18 : 15,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: selectedSpotId === spot.id ? 3 : 2,
                borderColor: selectedSpotId === spot.id ? '#2563EB' : '#FFFFFF',
                backgroundColor: spot.is_available ? '#059669' : '#DC2626',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
                elevation: 5,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>P</Text>
            </View>
            <Callout tooltip>
              <View style={{
                backgroundColor: '#FFFFFF',
                padding: 15,
                borderRadius: 12,
                minWidth: 180,
                maxWidth: 220,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
                  {spot.title}
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
                  {spot.description}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: spot.is_available ? '#059669' : '#DC2626',
                      marginRight: 6,
                    }} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: spot.is_available ? '#059669' : '#DC2626',
                      }}
                    >
                      {spot.is_available ? 'Available' : 'Occupied'}
                    </Text>
                  </View>
                  {spot.is_available && (
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#2563EB',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 6,
                      }}
                      onPress={() => onSpotPress(spot)}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                        Book Parking
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {spot.is_available && (
                  <Text style={{ 
                    fontSize: 10, 
                    color: '#6B7280', 
                    textAlign: 'center',
                    marginTop: 8,
                    fontStyle: 'italic'
                  }}>
                    Hourly rates available
                  </Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      
      {/* Floating action button to center on user location */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          backgroundColor: '#2563EB',
          width: 50,
          height: 50,
          borderRadius: 25,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 5,
        }}
        onPress={onLocationPress}
      >
        <Navigation size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};