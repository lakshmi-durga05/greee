import React from 'react';

const reviews = [
  {
    name: 'John Doe',
    username: '@john_doe',
    body: "This service is amazing!",
    img: 'https://avatar.vercel.sh/john',
  },
  {
    name: 'Jane Smith',
    username: '@jane_smith',
    body: "Highly recommend to everyone.",
    img: 'https://avatar.vercel.sh/jane',
  },
  {
    name: 'Mark Johnson',
    username: '@mark_johnson',
    body: "A game-changer in the industry.",
    img: 'https://avatar.vercel.sh/mark',
  },
  // Add more reviews as needed
];

const ReviewCard = ({ img, name, username, body }) => {
  return (
    <figure className="relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4 border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05] dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]">
      <div className="flex flex-row items-center gap-2">
        <img className="rounded-full" width="32" height="32" alt={name} src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">{name}</figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm">{body}</blockquote>
    </figure>
  );
};

const Testimonials = () => (
  <div className="overflow-hidden">
    <div className="flex animate-marquee space-x-4">
      {reviews.map((review) => (
        <div className="flex-shrink-0 p-4" key={review.username}>
          <ReviewCard {...review} />
        </div>
      ))}
    </div>
  </div>
);

export default Testimonials;
