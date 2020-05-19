import React from 'react';

import RentalItemsList from './components/RentalItemsList';
import RentalRequestTile from './components/RentalRequestTile';
import RentalProgressTile from './components/RentalProgressTile';

const COMPONENT = 'RentalPanel';

const RentalPanel = props => {
  console.log(COMPONENT, 'props = ', props);

  const {rentalRequest} = props;

  if (rentalRequest && !rentalRequest.status) {
    return (
      <RentalRequestTile
        navigation={props.navigation}
        rentalRequest={rentalRequest}
      />
    );
  } else if (rentalRequest && rentalRequest.status) {
    return (
      <RentalProgressTile
        navigation={props.navigation}
        rentalRequest={rentalRequest}
      />
    );
  }

  return <RentalItemsList navigation={props.navigation} />;
};

export default RentalPanel;
