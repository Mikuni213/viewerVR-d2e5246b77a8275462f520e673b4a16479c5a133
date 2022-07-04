import * as React from 'react';
import {createMuiTheme} from '@material-ui/core/styles';
import {ThemeProvider} from '@material-ui/styles';
import styles from '../styles/style.scss';

const theme = createMuiTheme({
    palette: {
      primary: {
        light: '#ffac33',
        main: '#ff9800',
        dark: '#b26a00',
        contrastText: '#fff',
      },
      secondary: {
        light: '#33bfff',
        main: '#00b0ff',
        dark: '#007bb2',
        contrastText: '#000',
      },
    },
  });

  export default function Layout({children}) {
      return (
          <ThemeProvider theme={theme}>
            <div className={styles.app}>
              {children}
            </div>
          </ThemeProvider>
      );
  }