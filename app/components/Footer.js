import React from 'react';

import {View, Tile, Caption} from '@shoutem/ui';

const Footer = props => {
  const isHermes =
    global.HermesInternal != null ? 'Hermes: enabled' : 'Hermes: disabled';

  return (
    <View>
      <Tile styleName="text-centric md-gutter clear">
        <Caption styleName="sm-gutter-top">
          Ver 0.0.1 ALPHA | {isHermes}
        </Caption>
      </Tile>
    </View>
  );
};

export default Footer;
