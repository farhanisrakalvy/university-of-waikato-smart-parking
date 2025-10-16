// MapComponent.web.tsx - Web version (no maps)
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { List, Map as MapIcon } from 'lucide-react-native';

interface MapComponentProps {
  onSwitchToList?: () => void;
  style: any;
  spots?: any[];
  mapRegion?: any;
  onRegionChange?: (region: any) => void;
  onSpotPress?: (spot: any) => void;
  onLocationPress?: () => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({ onSwitchToList = () => {}, style }) => {
  return (
    <View style={[style, { backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }]}>
      <View style={{ alignItems: 'center', padding: 40 }}>
        <MapIcon size={48} color="#6B7280" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#374151', marginTop: 16, marginBottom: 8 }}>
          Map View Unavailable
        </Text>
        <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 24 }}>
          Maps are not available on web. Please use the list view or try on mobile.
        </Text>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#2563EB',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={onSwitchToList}
        >
          <List size={20} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
            Switch to List View
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};