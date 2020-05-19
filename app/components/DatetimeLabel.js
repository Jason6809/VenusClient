import React from 'react';
import {StyleSheet} from 'react-native';

import {
  View,
  Title,
  Text,
  Caption,
  Tile,
  Row,
  Button,
  TouchableOpacity,
  Subtitle,
  Icon,
  Divider,
} from '@shoutem/ui';

const DatetimeLabel = props => {
  const days = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'June',
    'July',
    'Aug',
    'Sept',
    'Oct',
    'Nov',
    'Dec',
  ];

  switch (props.type) {
    case 'Text':
      if (props.min < 10) {
        return (
          <Text style={props.style}>
            {`${days[props.day]}, ${props.date} ${months[props.month]} ${
              props.year
            } |  ${props.hour}: 0${props.min}`}
          </Text>
        );
      } else {
        return (
          <Text style={props.style}>
            {`${days[props.day]}, ${props.date} ${months[props.month]} ${
              props.year
            } |  ${props.hour}: ${props.min}`}
          </Text>
        );
      }

    case 'Caption':
      if (props.min < 10) {
        return (
          <Caption style={props.style}>
            {`${days[props.day]}, ${props.date} ${months[props.month]} ${
              props.year
            }
             |  ${props.hour}: 0${props.min}`}
          </Caption>
        );
      } else {
        return (
          <Caption style={props.style}>
            {`${days[props.day]}, ${props.date} ${months[props.month]} ${
              props.year
            } |  ${props.hour}: ${props.min}`}
          </Caption>
        );
      }
    default:
      break;
  }
};

export default DatetimeLabel;
