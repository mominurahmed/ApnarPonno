import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-primary text-white pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">ApnarPonno</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              We are committed to providing you with the purest and most natural organic products. Quality and trust are our top priorities.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-secondary transition-all"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-secondary transition-all"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-secondary transition-all"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link to="/products" className="hover:text-secondary transition-colors">All Products</Link></li>
              <li><Link to="/categories" className="hover:text-secondary transition-colors">Categories</Link></li>
              <li><Link to="/offers" className="hover:text-secondary transition-colors">Special Offers</Link></li>
              <li><Link to="/about" className="hover:text-secondary transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6">Customer Service</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link to="/orders" className="hover:text-secondary transition-colors">My Orders</Link></li>
              <li><Link to="/track-order" className="hover:text-secondary transition-colors">Track Order</Link></li>
              <li><Link to="/profile" className="hover:text-secondary transition-colors">Account Details</Link></li>
              <li><Link to="/shipping" className="hover:text-secondary transition-colors">Shipping Policy</Link></li>
              <li><Link to="/returns" className="hover:text-secondary transition-colors">Return & Refund</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6">Contact Us</h3>
            <ul className="space-y-4 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-secondary shrink-0" />
                <span>House 12, Road 5, Sector 3, Uttara, Dhaka</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-secondary shrink-0" />
                <span>+880 1234 567890</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-secondary shrink-0" />
                <span>support@apnarponno.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 text-center text-xs text-white/40">
          <p>© 2026 ApnarPonno. All Rights Reserved. Pure & Natural.</p>
        </div>
      </div>
    </footer>
  );
};
