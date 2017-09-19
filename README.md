# gladys-bluetooth 

The goal of this module is to scan bluetooth inside the house to detect devices we have on us. 

Examples :

- [FitBit Charge 2](https://www.amazon.fr/gp/product/B01KSX392O/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&tag=gladproj-21&camp=1642&creative=6746&linkCode=as2&creativeASIN=B01KSX392O&linkId=3178477ad8485c87c4739c225618691f)
- A [Nut mini](https://www.amazon.fr/gp/product/B01AUNMQMG/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&tag=gladproj-21&camp=1642&creative=6746&linkCode=as2&creativeASIN=B01AUNMQMG&linkId=a6bb1c4769490a11a30d5a6b1e88c493) Bluetooth keychain

Thanks to these devices, Gladys is able to know when I'm at home or not, because if I'm at home, my Fitbit or my keys are probably on me. 

## Installation

Connect to your Raspberry Pi. 

Clone this repository : 

```
git clone https://github.com/GladysProject/gladys-bluetooth
```

Go the directory :

```
cd gladys-bluetooth
```

Install the dependencies : 

If you have yarn (pre-installed on Gladys Raspbian image), just do :

```
yarn install
```

If not, you can do :

```
npm install
```

You now need to modify the `config.js` file :

```
nano config.js
```

Edit each line with your configuration.

To allow the node process to access bluetooth withou sudo rights, execute : 

```
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
```

Then, execute :

```
pm2 start /home/pi/gladys-bluetooth/app.js --name gladys-bluetooth
```

So that gladys-bluetooth run in background :)