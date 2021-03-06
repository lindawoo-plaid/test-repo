import React from 'react';

import Button from 'plaid-threads/Button';

import { UserType, AppFundType } from './types';

import { currencyFilter } from '../util';

interface Props {
  userTransfer: () => void;
  user: UserType;
  appFund: AppFundType;
  numOfItems: number;
}

const PatternAccount = (props: Props) => {
  const handleClick = () => {
    props.userTransfer();
  };
  return (
    <div>
      <div className="pattern-account__header">
        <h3 className="accountBalance">Plaid Pattern Funds Balance</h3>{' '}
        {props.numOfItems > 0 && (
          <div className="transfer-funds__button__container">
            <Button onClick={handleClick} inline small>
              Transfer funds
            </Button>
          </div>
        )}
      </div>
      <div>
        <h3 className="accountDollars">
          {currencyFilter(props.appFund.balance)}
        </h3>
      </div>
    </div>
  );
};

export default PatternAccount;
