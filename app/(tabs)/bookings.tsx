import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  MapPin,
  Clock,
  Circle as XCircle,
} from 'lucide-react-native';

type BookingWithSpot = Database['public']['Tables']['bookings']['Row'] & {
  parking_spots: Database['public']['Tables']['parking_spots']['Row'];
};

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<BookingWithSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  // Function to handle booking deletion
  const handleDeleteBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    // Only allow deletion of canceled or completed bookings
    if (booking.status !== 'canceled' && booking.status !== 'completed') {
      Alert.alert('Cannot Delete', 'Only canceled or completed bookings can be deleted');
      return;
    }

    Alert.alert(
      'Delete Booking',
      'Are you sure you want to delete this booking?',
      [
        { text: 'No' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingId);

              if (error) throw error;

              // Update local state immediately
              setBookings(currentBookings => 
                currentBookings.filter(b => b.id !== bookingId)
              );
              
              Alert.alert('Success', 'Booking has been deleted');
            } catch (error) {
              console.error('Error deleting booking:', error);
              Alert.alert('Error', 'Failed to delete booking');
              // Refresh the list in case of error
              fetchBookings();
            }
          }
        }
      ]
    );
  };

  // Function to check if booking can be deleted
  const canDeleteBooking = (booking: BookingWithSpot) => {
    return booking.status === 'canceled' || booking.status === 'completed';
  };

  useEffect(() => {
    console.log('BookingsScreen mounted, user:', user?.id);
    
    if (user) {
      fetchBookings();

      // Subscribe to booking changes
      const subscription = supabase
        .channel('bookings_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log('Booking changed, refreshing...');
            fetchBookings();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchBookings = async (showLoading = true) => {
    if (!user) return;

    if (showLoading) {
      setLoading(true);
    }

    try {
      console.log('Fetching bookings for user:', user.id);
      const { data, error } = await supabase
        .from('bookings')
        .select(
          `
          *,
          parking_spots (*)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Bookings fetched:', data?.length || 0, 'bookings');
      if (data && data.length > 0) {
        console.log('First booking:', {
          id: data[0].id,
          status: data[0].status,
          startTime: new Date(data[0].start_time).toISOString(),
          endTime: new Date(data[0].end_time).toISOString()
        });
      }
      
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBookings(false); // Don't show loading spinner during refresh
    } catch (error) {
      console.error('Error refreshing bookings:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    // Find the booking to check cancellation policy
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const startTime = new Date(booking.start_time);
    const now = new Date();
    // Calculate hours until parking starts
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    console.log('Attempting to cancel booking:', {
      id: bookingId,
      startTime: startTime.toISOString(),
      now: now.toISOString(),
      hoursUntilStart
    });

    // Can only cancel if at least 2 hours before parking start time
    if (hoursUntilStart < 2) {
      if (hoursUntilStart < 0) {
        Alert.alert(
          'Cannot Cancel',
          'This parking session has already started and cannot be cancelled.'
        );
      } else {
        Alert.alert(
          'Cannot Cancel',
          `Your parking starts in ${(hoursUntilStart * 60).toFixed(0)} minutes. ` +
          'Bookings must be cancelled at least 2 hours before the parking start time.'
        );
      }
      return;
    }

    const handleCancellation = async () => {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'canceled' })
          .eq('id', bookingId);

        if (error) throw error;

        Alert.alert(
          'Success', 
          'Your booking has been cancelled successfully',
          [{ text: 'OK' }],
          { cancelable: false }
        );
        fetchBookings();
      } catch (error) {
        console.error('Error canceling booking:', error);
        Alert.alert(
          'Error', 
          'Failed to cancel booking. Please try again.',
          [{ text: 'OK' }],
          { cancelable: false }
        );
      }
    };

    // Show confirmation dialog
    Alert.alert(
      'Cancel Booking',
      'Note: You can only cancel a booking at least 2 hours before the parking start time.\n\nAre you sure you want to cancel this booking?',
      [
        {
          text: 'No',
          style: Platform.OS === 'ios' ? 'cancel' : 'default',
          onPress: () => { }
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: handleCancellation
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      ' at ' +
      date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#059669';
      case 'pending':
        return '#D97706';
      case 'completed':
        return '#6B7280';
      case 'canceled':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  const isBookingActive = (booking: BookingWithSpot) => {
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    return now >= startTime && now <= endTime && booking.status === 'confirmed';
  };

  const canCancelBooking = (booking: BookingWithSpot) => {
    if (!booking || !booking.start_time || booking.status !== 'confirmed') {
      console.log('Basic booking validation failed:', {
        exists: !!booking,
        hasStartTime: !!booking?.start_time,
        status: booking?.status
      });
      return false;
    }

    const startTime = new Date(booking.start_time);
    const now = new Date();
    
    // Calculate time difference in hours
    const hoursDifference = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isFutureBooking = startTime > now;
    const hasEnoughNotice = hoursDifference >= 2;
    
    console.log('Checking cancellation eligibility:', {
      bookingId: booking.id,
      status: booking.status,
      startTime: startTime.toISOString(),
      now: now.toISOString(),
      hoursDifference: hoursDifference.toFixed(1),
      isFutureBooking,
      hasEnoughNotice,
      canCancel: booking.status === 'confirmed' && isFutureBooking && hasEnoughNotice
    });
    
    return booking.status === 'confirmed' && isFutureBooking && hasEnoughNotice;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>
          {bookings.filter((b) => b.status === 'confirmed').length} active
          bookings
        </Text>
      </View>

      <ScrollView
        style={styles.bookingsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']} // Android
            tintColor="#2563EB" // iOS
          />
        }
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#6B7280" />
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyText}>
              Start by booking a parking spot from the map
            </Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={[
                styles.bookingCard,
                isBookingActive(booking) && styles.activeBooking
              ]}
              onLongPress={() => handleDeleteBooking(booking.id)}
              delayLongPress={500}
            >
              <View style={styles.bookingHeader}>
                <View style={styles.spotInfo}>
                  <Text style={styles.spotTitle}>
                    {booking.parking_spots.title}
                  </Text>
                  <Text style={styles.spotDescription}>
                    {booking.parking_spots.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(booking.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {booking.parking_spots.latitude.toFixed(4)},{' '}
                    {booking.parking_spots.longitude.toFixed(4)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {formatDate(booking.start_time)} -{' '}
                    {formatDate(booking.end_time)}
                  </Text>
                </View>
              </View>

              {isBookingActive(booking) && (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeText}>Currently active</Text>
                </View>
              )}

              {booking.status === 'confirmed' && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => cancelBooking(booking.id)}
                >
                  <XCircle size={16} color="#DC2626" />
                  <Text style={styles.cancelButtonText}>
                    Cancel Booking
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  deleteButtonText: {
    color: '#DC2626',
  },
  editableCard: {
    opacity: 0.8,
  },
  selectedCard: {
    borderColor: '#2563EB',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light background fallback in case of gaps
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  bookingsList: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeBooking: {
    borderColor: '#059669',
    borderWidth: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  spotInfo: {
    flex: 1,
    marginRight: 12,
  },
  spotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  spotDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  activeIndicator: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  activeText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: 6,
  },
  cancelNotice: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
});