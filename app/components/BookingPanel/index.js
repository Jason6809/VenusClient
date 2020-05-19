import React from 'react';

import AppointmentTile from './components/AppointmentTile';
import BookingFormTile from './components/BookingFormTile';
import BookingRequestTile from './components/BookingRequestTile';

const COMPONENT = 'BookingPanel: ';

const BookingPanel = props => {
  console.log(COMPONENT, 'props = ', props);

  // console.log(COMPONENT, 'props.navigation', props.navigation);

  const {bookingRequest} = props;

  if (bookingRequest && !bookingRequest.status) {
    return (
      <BookingRequestTile
        navigation={props.navigation}
        bookingRequest={bookingRequest}
      />
    );
  } else if (bookingRequest && bookingRequest.status) {
    return (
      <AppointmentTile
        navigation={props.navigation}
        bookingRequest={bookingRequest}
      />
    );
  }
  return <BookingFormTile navigation={props.navigation} />;
};

export default BookingPanel;
